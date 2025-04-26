from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Dict, Any, Optional, List
from ..services.chapter_service import extract_chapter_content, extract_all_course_chapters
from ..dependencies.auth import get_current_user
from ..models.chapter import ChapterExtractRequest, ChapterExtractAllRequest

router = APIRouter(
    prefix="/chapters",
    tags=["chapters"],
    responses={404: {"description": "Not found"}},
)

@router.post("/extract")
async def extract_chapter(
    request: ChapterExtractRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Extrait le contenu d'un chapitre spécifique et le convertit en JSON
    """
    try:
        result = await extract_chapter_content(request.chapter_id)
        return {
            "success": True,
            "chapter_id": request.chapter_id,
            "json_data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'extraction du contenu: {str(e)}")

@router.post("/extract-all")
async def extract_all_chapters(
    request: ChapterExtractAllRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Extrait le contenu de tous les chapitres d'un cours
    """
    try:
        processed_count = await extract_all_course_chapters(request.course_id)
        return {
            "success": True,
            "course_id": request.course_id,
            "processed_count": processed_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'extraction du contenu: {str(e)}")

@router.post("/upload")
async def upload_chapter_file(
    file: UploadFile = File(...),
    chapter_id: str = Form(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Télécharge un fichier et l'associe à un chapitre
    """
    try:
        # Logique d'upload à implémenter
        return {
            "success": True,
            "chapter_id": chapter_id,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload du fichier: {str(e)}")
