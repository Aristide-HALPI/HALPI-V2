from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Literal

# Type de contenu possible pour un chapitre
ContentType = Literal['course', 'exercise', 'exam']

class ChapterExtractRequest(BaseModel):
    """
    Modèle pour la requête d'extraction d'un chapitre
    """
    chapter_id: str

class ChapterExtractAllRequest(BaseModel):
    """
    Modèle pour la requête d'extraction de tous les chapitres d'un cours
    """
    course_id: str

class ChapterContent(BaseModel):
    """
    Modèle pour le contenu extrait d'un chapitre
    """
    title: str
    type: str  # pdf, docx, pptx, etc.
    content_type: ContentType = 'course'  # Type de contenu: cours, exercice, examen
    pages: List[Dict[str, Any]] = []  # Liste des pages avec leur contenu
    metadata: Dict[str, Any] = {}  # Métadonnées du document
