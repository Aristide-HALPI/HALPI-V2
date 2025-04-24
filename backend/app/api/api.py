from fastapi import APIRouter

from app.api.endpoints import profile, courses, parcours, activities, agenda, auth

api_router = APIRouter()

# Auth endpoints
api_router.include_router(auth.router, tags=["auth"])

# Profile endpoints
api_router.include_router(profile.router, tags=["profile"])

# Courses endpoints
api_router.include_router(courses.router, tags=["courses"])

# Parcours endpoints
api_router.include_router(parcours.router, tags=["parcours"])

# Activities endpoints
api_router.include_router(activities.router, tags=["activities"])

# Agenda endpoints
api_router.include_router(agenda.router, tags=["agenda"])
