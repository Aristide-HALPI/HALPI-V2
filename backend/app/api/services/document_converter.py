import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
import logging

logger = logging.getLogger(__name__)

class DocumentConverter:
    """Service pour convertir différents formats de documents en PDF."""
    
    SUPPORTED_FORMATS = {
        # Microsoft Office
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',  # Word
        'application/msword': '.doc',  # Word ancien format
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',  # PowerPoint
        'application/vnd.ms-powerpoint': '.ppt',  # PowerPoint ancien format
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',  # Excel
        'application/vnd.ms-excel': '.xls',  # Excel ancien format
        
        # LibreOffice / OpenOffice
        'application/vnd.oasis.opendocument.text': '.odt',
        'application/vnd.oasis.opendocument.presentation': '.odp',
        'application/vnd.oasis.opendocument.spreadsheet': '.ods',
        
        # Autres formats
        'text/plain': '.txt',
        'text/rtf': '.rtf',
        'application/rtf': '.rtf',
    }
    
    @staticmethod
    async def convert_to_pdf(file: UploadFile) -> tuple[str, bytes]:
        """
        Convertit un fichier en PDF.
        
        Args:
            file: Le fichier à convertir
            
        Returns:
            tuple: (nom du fichier PDF, contenu du fichier PDF)
            
        Raises:
            HTTPException: Si la conversion échoue
        """
        if file.content_type == 'application/pdf':
            # Le fichier est déjà un PDF, pas besoin de conversion
            content = await file.read()
            await file.seek(0)  # Réinitialiser le curseur pour une utilisation ultérieure
            return f"{Path(file.filename).stem}.pdf", content
            
        if file.content_type not in DocumentConverter.SUPPORTED_FORMATS:
            supported_formats = ", ".join(DocumentConverter.SUPPORTED_FORMATS.values())
            raise HTTPException(
                status_code=400, 
                detail=f"Format de fichier non pris en charge. Formats supportés: {supported_formats}"
            )
        
        # Créer un répertoire temporaire pour les fichiers
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Générer un nom de fichier unique
            extension = DocumentConverter.SUPPORTED_FORMATS[file.content_type]
            temp_filename = f"{uuid.uuid4()}{extension}"
            temp_filepath = os.path.join(temp_dir, temp_filename)
            
            # Écrire le fichier temporaire
            content = await file.read()
            with open(temp_filepath, "wb") as temp_file:
                temp_file.write(content)
            
            # Nom du fichier PDF de sortie
            output_filename = f"{Path(temp_filename).stem}.pdf"
            output_filepath = os.path.join(temp_dir, output_filename)
            
            # Conversion avec LibreOffice
            try:
                # Utiliser soffice (LibreOffice) pour la conversion
                # --headless: mode sans interface graphique
                # --convert-to pdf: convertir en PDF
                # --outdir: répertoire de sortie
                process = subprocess.run([
                    "soffice",
                    "--headless",
                    "--convert-to", "pdf",
                    "--outdir", temp_dir,
                    temp_filepath
                ], capture_output=True, text=True, check=True)
                
                logger.info(f"Conversion réussie: {process.stdout}")
                
                # Lire le fichier PDF généré
                with open(output_filepath, "rb") as pdf_file:
                    pdf_content = pdf_file.read()
                
                # Retourner le nom original avec extension .pdf et le contenu
                original_name = Path(file.filename).stem
                return f"{original_name}.pdf", pdf_content
                
            except subprocess.CalledProcessError as e:
                logger.error(f"Erreur lors de la conversion: {e.stderr}")
                raise HTTPException(
                    status_code=500,
                    detail="Erreur lors de la conversion du document en PDF"
                )
                
        finally:
            # Nettoyer les fichiers temporaires
            for temp_file in os.listdir(temp_dir):
                try:
                    os.remove(os.path.join(temp_dir, temp_file))
                except Exception as e:
                    logger.warning(f"Impossible de supprimer le fichier temporaire {temp_file}: {e}")
            
            try:
                os.rmdir(temp_dir)
            except Exception as e:
                logger.warning(f"Impossible de supprimer le répertoire temporaire {temp_dir}: {e}")
