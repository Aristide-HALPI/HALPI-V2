from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from ..config.supabase import supabase_client

# Charger les variables d'environnement
load_dotenv()

# Configuration de la sécurité
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Vérifie le token JWT et retourne les informations de l'utilisateur
    
    Args:
        credentials: Credentials extraites de l'en-tête Authorization
        
    Returns:
        Informations de l'utilisateur
        
    Raises:
        HTTPException: Si le token est invalide ou expiré
    """
    try:
        token = credentials.credentials
        
        # Vérifier le token avec Supabase
        user_response = supabase_client.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide ou expiré",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_response.user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Erreur d'authentification: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
