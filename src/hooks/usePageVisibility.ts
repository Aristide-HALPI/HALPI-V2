import { useState, useEffect } from 'react';

/**
 * Hook pour détecter les changements de visibilité de la page
 * Utile pour éviter les rechargements intempestifs lors des changements d'onglet
 */
export function usePageVisibility() {
  // État initial basé sur la propriété document.hidden
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [lastVisibleTime, setLastVisibleTime] = useState(Date.now());

  useEffect(() => {
    // Gestionnaire d'événement pour visibilitychange
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      // Si la page redevient visible, enregistrer le timestamp
      if (visible) {
        setLastVisibleTime(Date.now());
      }
    };

    // Ajouter l'écouteur d'événement
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Nettoyage
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isVisible, lastVisibleTime };
}
