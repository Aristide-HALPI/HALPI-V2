from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.core.config import settings

app = FastAPI(
    title="HALPI V2 API",
    description="API pour la plateforme d'apprentissage du windsurf assistée par IA",
    version="2.0.0",
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes API
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """
    Racine de l'API - Vérification de santé
    """
    return {
        "message": "HALPI V2 API est en ligne",
        "status": "ok",
        "version": "2.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
