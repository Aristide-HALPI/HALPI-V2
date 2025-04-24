from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.api.models.pydantic_models import UserProfile, UserProfileUpdate
from app.api.services.auth import get_current_active_user
from app.api.services.supabase import supabase

router = APIRouter()


@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get current user profile
    """
    try:
        response = supabase.table("user_profiles").select("*").eq("id", current_user.id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving profile: {str(e)}")


@router.patch("/profile/settings", response_model=UserProfile)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Update current user profile
    """
    try:
        # Convert model to dict and remove None values
        update_data = {k: v for k, v in profile_update.dict().items() if v is not None}
        
        if not update_data:
            return await get_user_profile(current_user)
        
        response = supabase.table("user_profiles").update(update_data).eq("id", current_user.id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")


@router.get("/profile/course-progress", response_model=List[Dict[str, Any]])
async def get_user_course_progress(
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get progress for all courses of the current user
    """
    try:
        # Get user's course progress with course details
        response = supabase.table("user_course_progress") \
            .select("*, courses(*)") \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not response.data:
            return []
        
        # Format response for frontend
        result = []
        for item in response.data:
            course = item.get("courses", {})
            
            # Get steps completed for this course
            steps_response = supabase.table("course_steps") \
                .select("step_key") \
                .eq("user_id", current_user.id) \
                .eq("course_id", item.get("course_id")) \
                .eq("completed", True) \
                .execute()
            
            steps_completed = [step.get("step_key") for step in steps_response.data] if steps_response.data else []
            
            # Get quiz scores for this course
            quiz_response = supabase.table("quiz_results") \
                .select("quiz_number, score") \
                .eq("user_id", current_user.id) \
                .eq("course_id", item.get("course_id")) \
                .execute()
            
            quiz_scores = {}
            if quiz_response.data:
                for quiz in quiz_response.data:
                    quiz_scores[f"quiz_{quiz.get('quiz_number')}"] = quiz.get("score")
            
            result.append({
                "id": item.get("id"),
                "course_id": item.get("course_id"),
                "course_name": course.get("name"),
                "progression_rate": item.get("progression_rate", 0),
                "total_study_time": item.get("total_study_time", 0),
                "confidence_level": item.get("confidence_level", 0),
                "exam_date": item.get("exam_date"),
                "exam_grade": item.get("exam_grade"),
                "last_updated_at": item.get("last_updated_at"),
                "steps_completed": steps_completed,
                "quiz_scores": quiz_scores
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving course progress: {str(e)}")


@router.post("/profile/exam-feedback", response_model=Dict[str, Any])
async def submit_exam_feedback(
    feedback_data: Dict[str, Any],
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Submit feedback for an exam
    """
    try:
        # Validate required fields
        required_fields = ["course_id", "grade"]
        for field in required_fields:
            if field not in feedback_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Add user_id to data
        feedback_data["user_id"] = current_user.id
        
        # Insert feedback
        feedback_response = supabase.table("exam_feedback").insert(feedback_data).execute()
        
        if not feedback_response.data:
            raise HTTPException(status_code=400, detail="Error submitting exam feedback")
        
        # Update course progress with exam grade
        progress_response = supabase.table("user_course_progress") \
            .update({"exam_grade": feedback_data["grade"]}) \
            .eq("user_id", current_user.id) \
            .eq("course_id", feedback_data["course_id"]) \
            .execute()
        
        return {
            "success": True,
            "message": "Exam feedback submitted successfully",
            "feedback_id": feedback_response.data[0].get("id")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting exam feedback: {str(e)}")
