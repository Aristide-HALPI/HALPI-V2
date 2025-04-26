from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import Response
from typing import Optional
import logging

from ..services.document_converter import DocumentConverter

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/convert-to-pdf")
async def convert_document_to_pdf(
    file: UploadFile = File(...),
) -> Response:
    """
    Convertit un document (Word, PowerPoint, etc.) en PDF.
    
    Args:
        file: Le fichier à convertir
        
    Returns:
        Le fichier PDF converti
    """
    try:
        logger.info(f"Tentative de conversion du fichier: {file.filename}")
        
        # Convertir le fichier en PDF
        filename, pdf_content = await DocumentConverter.convert_to_pdf(file)
        
        # Retourner le PDF
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        logger.error(f"Erreur lors de la conversion: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Erreur lors de la conversion: {str(e)}")
