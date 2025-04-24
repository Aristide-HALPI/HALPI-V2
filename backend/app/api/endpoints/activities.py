from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.api.models.pydantic_models import Activity, ActivityUpdate
from app.api.services.auth import get_current_active_user
from app.api.services.supabase import supabase

router = APIRouter()


@router.get("/activities/{activity_id}", response_model=Dict[str, Any])
async def get_activity(
    activity_id: UUID,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific activity with its details
    """
    try:
        # Get activity with related data
        response = supabase.table("activities") \
            .select("*, activity_types(*), chapters(*)") \
            .eq("id", str(activity_id)) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        activity = response.data[0]
        
        # Get course data if available
        if activity.get("course_id"):
            course_response = supabase.table("courses") \
                .select("*") \
                .eq("id", activity.get("course_id")) \
                .execute()
            
            if course_response.data:
                activity["course"] = course_response.data[0]
        
        return activity
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving activity: {str(e)}")


@router.post("/activities/{activity_id}/start", response_model=Activity)
async def start_activity(
    activity_id: UUID,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Mark an activity as started
    """
    try:
        # Check if activity exists and belongs to user
        activity_response = supabase.table("activities") \
            .select("*") \
            .eq("id", str(activity_id)) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not activity_response.data:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        # Update activity status
        update_data = {
            "status": "in_progress",
            "updated_at": "now()"
        }
        
        response = supabase.table("activities") \
            .update(update_data) \
            .eq("id", str(activity_id)) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error updating activity")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting activity: {str(e)}")


@router.post("/activities/{activity_id}/complete", response_model=Activity)
async def complete_activity(
    activity_id: UUID,
    data: Dict[str, Any],
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Mark an activity as completed with optional score
    """
    try:
        # Check if activity exists and belongs to user
        activity_response = supabase.table("activities") \
            .select("*, activity_types(*), chapters(*), courses(*)") \
            .eq("id", str(activity_id)) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not activity_response.data:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        activity = activity_response.data[0]
        
        # Update activity status and score
        update_data = {
            "status": "completed",
            "updated_at": "now()"
        }
        
        # Add score if provided
        if "score" in data:
            update_data["score"] = data["score"]
        
        response = supabase.table("activities") \
            .update(update_data) \
            .eq("id", str(activity_id)) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error completing activity")
        
        # Trigger progress calculation if course_id is available
        if activity.get("course_id"):
            # This would normally call a database function or trigger
            # For now, we'll manually recalculate progress
            await calculate_course_progress(current_user.id, activity.get("course_id"))
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completing activity: {str(e)}")


async def calculate_course_progress(user_id: str, course_id: str) -> None:
    """
    Calculate and update course progress
    This would normally be a database function or trigger
    """
    try:
        # Get all activities for this course and user
        activities_response = supabase.table("activities") \
            .select("*, activity_types(*)") \
            .eq("user_id", user_id) \
            .eq("course_id", course_id) \
            .execute()
        
        if not activities_response.data:
            return
        
        activities = activities_response.data
        
        # Calculate progress
        total_activities = len(activities)
        completed_activities = sum(1 for a in activities if a.get("status") == "completed")
        total_time = sum(a.get("activity_types", {}).get("weight", 1) * 30 for a in activities if a.get("status") == "completed")
        
        # Calculate weighted progress based on activity weights
        total_weight = sum(a.get("activity_types", {}).get("weight", 1) for a in activities)
        completed_weight = sum(a.get("activity_types", {}).get("weight", 1) for a in activities if a.get("status") == "completed")
        
        progression_rate = (completed_weight / total_weight) * 100 if total_weight > 0 else 0
        
        # Calculate confidence level (placeholder logic)
        confidence_level = sum(a.get("score", 0) for a in activities if a.get("status") == "completed" and a.get("score") is not None)
        confidence_count = sum(1 for a in activities if a.get("status") == "completed" and a.get("score") is not None)
        avg_confidence = (confidence_level / confidence_count) if confidence_count > 0 else None
        
        # Update or create progress record
        progress_response = supabase.table("user_course_progress") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("course_id", course_id) \
            .execute()
        
        progress_data = {
            "progression_rate": progression_rate,
            "total_study_time": total_time,
            "confidence_level": avg_confidence,
            "last_updated_at": "now()"
        }
        
        if progress_response.data:
            # Update existing record
            supabase.table("user_course_progress") \
                .update(progress_data) \
                .eq("user_id", user_id) \
                .eq("course_id", course_id) \
                .execute()
        else:
            # Create new record
            progress_data["user_id"] = user_id
            progress_data["course_id"] = course_id
            supabase.table("user_course_progress") \
                .insert(progress_data) \
                .execute()
    except Exception as e:
        # Log error but don't raise exception
        print(f"Error calculating course progress: {str(e)}")
