from datetime import datetime, date, time
from typing import Dict, List, Optional, Any, Union
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr


# Token models
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None


# User models
class UserBase(BaseModel):
    email: Optional[EmailStr] = None


class UserCreate(UserBase):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


class UserProfile(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    institution_type: Optional[str] = None
    institution: Optional[str] = None
    study_field: Optional[str] = None
    academic_year: Optional[str] = None
    platform_usage: Optional[str] = None
    availability: Optional[Dict[str, List[str]]] = None
    daily_time_goal: Optional[int] = 60
    weekly_time_goal: Optional[int] = 300
    created_at: datetime


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    institution_type: Optional[str] = None
    institution: Optional[str] = None
    study_field: Optional[str] = None
    academic_year: Optional[str] = None
    platform_usage: Optional[str] = None
    availability: Optional[Dict[str, List[str]]] = None
    daily_time_goal: Optional[int] = None
    weekly_time_goal: Optional[int] = None


# Course models
class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None
    level: Optional[str] = None
    image_url: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(CourseBase):
    name: Optional[str] = None


class Course(CourseBase):
    id: UUID
    created_at: datetime


# User Course models
class UserCourseBase(BaseModel):
    course_id: UUID
    exam_date: Optional[date] = None
    difficulty: Optional[str] = None
    estimated_time: Optional[int] = None
    content_type: Optional[str] = None


class UserCourseCreate(UserCourseBase):
    pass


class UserCourseUpdate(UserCourseBase):
    course_id: Optional[UUID] = None
    exam_date: Optional[date] = None


class UserCourse(UserCourseBase):
    id: UUID
    user_id: UUID
    created_at: datetime


# Chapter models
class ChapterBase(BaseModel):
    course_id: UUID
    title: str
    description: Optional[str] = None
    order_index: int
    source_url: Optional[str] = None
    json_data: Optional[Dict[str, Any]] = None
    chapter_type: Optional[str] = None


class ChapterCreate(ChapterBase):
    pass


class ChapterUpdate(ChapterBase):
    course_id: Optional[UUID] = None
    title: Optional[str] = None
    order_index: Optional[int] = None


class Chapter(ChapterBase):
    id: UUID
    created_at: datetime


# Activity Type models
class ActivityTypeBase(BaseModel):
    name: str
    scope: str
    is_required: bool = False
    weight: float = 1.0


class ActivityTypeCreate(ActivityTypeBase):
    pass


class ActivityTypeUpdate(ActivityTypeBase):
    name: Optional[str] = None
    scope: Optional[str] = None
    is_required: Optional[bool] = None
    weight: Optional[float] = None


class ActivityType(ActivityTypeBase):
    id: UUID
    created_at: datetime


# Activity models
class ActivityBase(BaseModel):
    course_id: Optional[UUID] = None
    chapter_id: Optional[UUID] = None
    activity_type_id: UUID
    status: str = "not_started"
    score: Optional[float] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(ActivityBase):
    course_id: Optional[UUID] = None
    chapter_id: Optional[UUID] = None
    activity_type_id: Optional[UUID] = None
    status: Optional[str] = None
    score: Optional[float] = None


class Activity(ActivityBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


# User Course Progress models
class UserCourseProgressBase(BaseModel):
    course_id: UUID
    progression_rate: Optional[float] = 0
    total_study_time: Optional[int] = 0
    confidence_level: Optional[float] = None
    exam_date: Optional[date] = None
    exam_grade: Optional[float] = None


class UserCourseProgressCreate(UserCourseProgressBase):
    pass


class UserCourseProgressUpdate(UserCourseProgressBase):
    course_id: Optional[UUID] = None
    progression_rate: Optional[float] = None
    total_study_time: Optional[int] = None
    confidence_level: Optional[float] = None
    exam_date: Optional[date] = None
    exam_grade: Optional[float] = None


class UserCourseProgress(UserCourseProgressBase):
    id: UUID
    user_id: UUID
    last_updated_at: datetime


# Daily Log models
class DailyLogBase(BaseModel):
    date: date
    sessions_completed: int = 0
    total_time: int = 0
    goal_met: bool = False
    day_closed: bool = False


class DailyLogCreate(DailyLogBase):
    pass


class DailyLogUpdate(DailyLogBase):
    date: Optional[date] = None
    sessions_completed: Optional[int] = None
    total_time: Optional[int] = None
    goal_met: Optional[bool] = None
    day_closed: Optional[bool] = None


class DailyLog(DailyLogBase):
    id: UUID
    user_id: UUID
    created_at: datetime


# J Reminder models
class JReminderBase(BaseModel):
    user_course_id: UUID
    j7: Optional[date] = None
    j3: Optional[date] = None
    j1: Optional[date] = None


class JReminderCreate(JReminderBase):
    pass


class JReminderUpdate(JReminderBase):
    user_course_id: Optional[UUID] = None
    j7: Optional[date] = None
    j3: Optional[date] = None
    j1: Optional[date] = None


class JReminder(JReminderBase):
    id: UUID
    created_at: datetime


# Daily Recommendation models
class DailyRecommendationBase(BaseModel):
    date: date
    recommended_activities: Dict[str, Any]


class DailyRecommendationCreate(DailyRecommendationBase):
    pass


class DailyRecommendationUpdate(DailyRecommendationBase):
    date: Optional[date] = None
    recommended_activities: Optional[Dict[str, Any]] = None


class DailyRecommendation(DailyRecommendationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
