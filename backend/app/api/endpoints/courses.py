from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.api.models.pydantic_models import Course, CourseCreate, CourseUpdate, UserCourse, UserCourseCreate
from app.api.services.auth import get_current_active_user
from app.api.services.supabase import supabase

router = APIRouter()


@router.get("/courses", response_model=List[Course])
async def get_courses(
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get all courses
    """
    try:
        response = supabase.table("courses").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving courses: {str(e)}")


@router.post("/courses", response_model=Course)
async def create_course(
    course_in: CourseCreate,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Create new course
    """
    try:
        response = supabase.table("courses").insert(course_in.dict()).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error creating course")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating course: {str(e)}")


@router.get("/courses/{course_id}", response_model=Course)
async def get_course(
    course_id: UUID,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific course by id
    """
    try:
        response = supabase.table("courses").select("*").eq("id", str(course_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving course: {str(e)}")


@router.patch("/courses/{course_id}", response_model=Course)
async def update_course(
    course_id: UUID,
    course_in: CourseUpdate,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Update a course
    """
    try:
        # Convert model to dict and remove None values
        update_data = {k: v for k, v in course_in.dict().items() if v is not None}
        
        if not update_data:
            return await get_course(course_id, current_user)
        
        response = supabase.table("courses").update(update_data).eq("id", str(course_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating course: {str(e)}")


@router.delete("/courses/{course_id}", response_model=Course)
async def delete_course(
    course_id: UUID,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Delete a course
    """
    try:
        # First get the course to return it after deletion
        course = await get_course(course_id, current_user)
        
        response = supabase.table("courses").delete().eq("id", str(course_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return course
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting course: {str(e)}")


@router.get("/user/courses", response_model=List[UserCourse])
async def get_user_courses(
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get all courses for current user
    """
    try:
        response = supabase.table("user_courses").select("*").eq("user_id", current_user.id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user courses: {str(e)}")


@router.post("/user/courses", response_model=UserCourse)
async def create_user_course(
    course_in: UserCourseCreate,
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Add a course to current user
    """
    try:
        # Check if course exists
        course_response = supabase.table("courses").select("*").eq("id", str(course_in.course_id)).execute()
        
        if not course_response.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Create user_course with user_id
        user_course_data = course_in.dict()
        user_course_data["user_id"] = current_user.id
        
        response = supabase.table("user_courses").insert(user_course_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error adding course to user")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding course to user: {str(e)}")
