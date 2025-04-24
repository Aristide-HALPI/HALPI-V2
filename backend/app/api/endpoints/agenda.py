from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from datetime import date, datetime, timedelta
from uuid import UUID

from app.api.models.pydantic_models import DailyLog, DailyLogCreate, DailyLogUpdate, DailyRecommendation
from app.api.services.auth import get_current_active_user
from app.api.services.supabase import supabase

router = APIRouter()


@router.get("/agenda/daily-logs", response_model=List[DailyLog])
async def get_daily_logs(
    start_date: date = None,
    end_date: date = None,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get daily logs for a date range
    """
    try:
        query = supabase.table("daily_logs").select("*").eq("user_id", current_user.id)
        
        if start_date:
            query = query.gte("date", start_date.isoformat())
        
        if end_date:
            query = query.lte("date", end_date.isoformat())
        
        response = query.order("date").execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving daily logs: {str(e)}")


@router.post("/agenda/daily-logs", response_model=DailyLog)
async def create_daily_log(
    log_in: DailyLogCreate,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Create a new daily log
    """
    try:
        # Check if log already exists for this date
        existing_log = supabase.table("daily_logs") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .eq("date", log_in.date.isoformat()) \
            .execute()
        
        if existing_log.data:
            raise HTTPException(status_code=400, detail="Daily log already exists for this date")
        
        # Create log
        log_data = log_in.dict()
        log_data["user_id"] = current_user.id
        
        response = supabase.table("daily_logs").insert(log_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error creating daily log")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating daily log: {str(e)}")


@router.patch("/agenda/daily-logs/{log_id}", response_model=DailyLog)
async def update_daily_log(
    log_id: UUID,
    log_in: DailyLogUpdate,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Update a daily log
    """
    try:
        # Convert model to dict and remove None values
        update_data = {k: v for k, v in log_in.dict().items() if v is not None}
        
        if not update_data:
            # Get current log if no updates
            response = supabase.table("daily_logs") \
                .select("*") \
                .eq("id", str(log_id)) \
                .eq("user_id", current_user.id) \
                .execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Daily log not found")
            
            return response.data[0]
        
        # Update log
        response = supabase.table("daily_logs") \
            .update(update_data) \
            .eq("id", str(log_id)) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Daily log not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating daily log: {str(e)}")


@router.get("/agenda/recommendations", response_model=Dict[str, Any])
async def get_daily_recommendations(
    target_date: date = None,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get daily recommendations for a specific date
    """
    try:
        # Use today if no date provided
        if not target_date:
            target_date = date.today()
        
        # Check if recommendations exist for this date
        recommendations_response = supabase.table("daily_recommendations") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .eq("date", target_date.isoformat()) \
            .execute()
        
        # If recommendations exist, return them
        if recommendations_response.data:
            return recommendations_response.data[0]
        
        # Otherwise, generate new recommendations
        new_recommendations = await generate_recommendations(current_user.id, target_date)
        
        return new_recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving recommendations: {str(e)}")


async def generate_recommendations(user_id: str, target_date: date) -> Dict[str, Any]:
    """
    Generate recommendations for a user on a specific date
    This is a placeholder for the actual recommendation algorithm
    """
    try:
        # Get user profile for time goals
        profile_response = supabase.table("user_profiles") \
            .select("*") \
            .eq("id", user_id) \
            .execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        profile = profile_response.data[0]
        daily_time_goal = profile.get("daily_time_goal", 60)  # Default 60 minutes
        
        # Get user courses with progress
        courses_response = supabase.table("user_courses") \
            .select("*, courses(*), user_course_progress(*)") \
            .eq("user_id", user_id) \
            .execute()
        
        if not courses_response.data:
            # No courses, return empty recommendations
            empty_recommendations = {
                "user_id": user_id,
                "date": target_date.isoformat(),
                "recommended_activities": {
                    "courses": [],
                    "total_time": 0,
                    "message": "No courses available for recommendations"
                }
            }
            
            # Save empty recommendations
            supabase.table("daily_recommendations").insert(empty_recommendations).execute()
            
            return empty_recommendations
        
        # Sort courses by priority (exam date, progress)
        courses = courses_response.data
        
        # Prioritize courses with upcoming exams
        today = date.today()
        prioritized_courses = []
        
        for course in courses:
            exam_date = course.get("exam_date")
            if exam_date:
                # Convert string to date if needed
                if isinstance(exam_date, str):
                    exam_date = datetime.strptime(exam_date, "%Y-%m-%d").date()
                
                days_until_exam = (exam_date - today).days
                
                # Higher priority for closer exams
                if days_until_exam <= 7:
                    priority = 3
                elif days_until_exam <= 30:
                    priority = 2
                else:
                    priority = 1
            else:
                priority = 0
            
            # Get progress
            progress = 0
            if course.get("user_course_progress") and course["user_course_progress"]:
                progress = course["user_course_progress"][0].get("progression_rate", 0)
            
            # Lower progress gets higher priority
            progress_priority = 100 - progress if progress else 100
            
            prioritized_courses.append({
                "course": course,
                "priority": priority,
                "progress_priority": progress_priority,
                "total_priority": priority * 100 + progress_priority  # Combined priority score
            })
        
        # Sort by total priority (higher is more important)
        prioritized_courses.sort(key=lambda x: x["total_priority"], reverse=True)
        
        # Get activities for top 3 courses
        top_courses = prioritized_courses[:3]
        recommended_activities = []
        
        for course_item in top_courses:
            course = course_item["course"]
            
            # Get incomplete activities for this course
            activities_response = supabase.table("activities") \
                .select("*, activity_types(*), chapters(*)") \
                .eq("user_id", user_id) \
                .eq("course_id", course["courses"]["id"]) \
                .neq("status", "completed") \
                .execute()
            
            if activities_response.data:
                # Sort activities by type priority
                activities = activities_response.data
                for activity in activities:
                    activity_type = activity.get("activity_types", {})
                    is_required = activity_type.get("is_required", False)
                    weight = activity_type.get("weight", 1.0)
                    
                    # Higher priority for required activities and higher weight
                    activity_priority = (2 if is_required else 1) * weight
                    
                    recommended_activities.append({
                        "activity": activity,
                        "course": course["courses"],
                        "priority": activity_priority
                    })
        
        # Sort activities by priority
        recommended_activities.sort(key=lambda x: x["priority"], reverse=True)
        
        # Limit activities to fit daily time goal (assuming 30 min per activity)
        time_per_activity = 30  # minutes
        max_activities = daily_time_goal // time_per_activity
        
        final_activities = recommended_activities[:max_activities]
        total_time = len(final_activities) * time_per_activity
        
        # Format recommendations
        recommendations = {
            "user_id": user_id,
            "date": target_date.isoformat(),
            "recommended_activities": {
                "activities": [
                    {
                        "id": item["activity"]["id"],
                        "type": item["activity"]["activity_types"]["name"],
                        "course_name": item["course"]["name"],
                        "chapter_title": item["activity"]["chapters"]["title"] if item["activity"].get("chapters") else None,
                        "estimated_time": time_per_activity,
                        "priority": item["priority"]
                    }
                    for item in final_activities
                ],
                "total_time": total_time,
                "message": f"Here are your recommended activities for {target_date.isoformat()}"
            }
        }
        
        # Save recommendations
        supabase.table("daily_recommendations").insert(recommendations).execute()
        
        return recommendations
    except Exception as e:
        # Log error but return empty recommendations
        print(f"Error generating recommendations: {str(e)}")
        
        empty_recommendations = {
            "user_id": user_id,
            "date": target_date.isoformat(),
            "recommended_activities": {
                "activities": [],
                "total_time": 0,
                "message": "Error generating recommendations"
            }
        }
        
        return empty_recommendations
