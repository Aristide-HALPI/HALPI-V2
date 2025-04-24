from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.api.models.pydantic_models import UserCourseProgress, Chapter
from app.api.services.auth import get_current_active_user
from app.api.services.supabase import supabase

router = APIRouter()


@router.get("/parcours", response_model=List[Dict[str, Any]])
async def get_user_parcours(
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get all parcours (courses with progress) for current user
    """
    try:
        # Get user's courses with progress
        progress_response = supabase.table("user_course_progress") \
            .select("*, courses(*)") \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not progress_response.data:
            # If no progress data, get user courses and return them with 0 progress
            courses_response = supabase.table("user_courses") \
                .select("*, courses(*)") \
                .eq("user_id", current_user.id) \
                .execute()
            
            if not courses_response.data:
                return []
            
            # Format response to include course info and default progress
            result = []
            for user_course in courses_response.data:
                course = user_course.get("courses", {})
                if course:
                    result.append({
                        "course_id": course.get("id"),
                        "name": course.get("name"),
                        "description": course.get("description"),
                        "level": course.get("level"),
                        "image_url": course.get("image_url"),
                        "progression_rate": 0,
                        "total_study_time": 0,
                        "confidence_level": 0,
                        "exam_date": user_course.get("exam_date"),
                        "exam_grade": None
                    })
            return result
        
        # Format response to include course info and progress
        result = []
        for progress in progress_response.data:
            course = progress.get("courses", {})
            if course:
                result.append({
                    "course_id": course.get("id"),
                    "name": course.get("name"),
                    "description": course.get("description"),
                    "level": course.get("level"),
                    "image_url": course.get("image_url"),
                    "progression_rate": progress.get("progression_rate", 0),
                    "total_study_time": progress.get("total_study_time", 0),
                    "confidence_level": progress.get("confidence_level", 0),
                    "exam_date": progress.get("exam_date"),
                    "exam_grade": progress.get("exam_grade")
                })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving parcours: {str(e)}")


@router.get("/parcours/{course_id}", response_model=Dict[str, Any])
async def get_course_progress(
    course_id: UUID,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get detailed progress for a specific course
    """
    try:
        # Get course details
        course_response = supabase.table("courses") \
            .select("*") \
            .eq("id", str(course_id)) \
            .execute()
        
        if not course_response.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course = course_response.data[0]
        
        # Get course progress
        progress_response = supabase.table("user_course_progress") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .eq("course_id", str(course_id)) \
            .execute()
        
        progress = progress_response.data[0] if progress_response.data else {
            "progression_rate": 0,
            "total_study_time": 0,
            "confidence_level": 0,
            "exam_date": None,
            "exam_grade": None
        }
        
        # Get chapters for this course
        chapters_response = supabase.table("chapters") \
            .select("*") \
            .eq("course_id", str(course_id)) \
            .order("order_index") \
            .execute()
        
        chapters = chapters_response.data
        
        # Get activities for this course and user
        activities_response = supabase.table("activities") \
            .select("*, activity_types(*)") \
            .eq("user_id", current_user.id) \
            .eq("course_id", str(course_id)) \
            .execute()
        
        activities = activities_response.data
        
        # Organize activities by chapter
        chapter_activities = {}
        for chapter in chapters:
            chapter_id = chapter.get("id")
            chapter_activities[chapter_id] = []
        
        for activity in activities:
            chapter_id = activity.get("chapter_id")
            if chapter_id in chapter_activities:
                chapter_activities[chapter_id].append(activity)
        
        # Build response
        result = {
            "course": course,
            "progress": progress,
            "chapters": []
        }
        
        for chapter in chapters:
            chapter_id = chapter.get("id")
            chapter_data = {
                "id": chapter_id,
                "title": chapter.get("title"),
                "description": chapter.get("description"),
                "order_index": chapter.get("order_index"),
                "chapter_type": chapter.get("chapter_type"),
                "activities": chapter_activities.get(chapter_id, [])
            }
            result["chapters"].append(chapter_data)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving course progress: {str(e)}")
