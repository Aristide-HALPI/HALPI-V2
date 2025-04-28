import React, { useState, useRef, useEffect } from 'react';

// Types pour les hotspots
export interface Hotspot {
  id: string;
  shape: 'circle' | 'rect';
  coords: {
    x: number; // Valeur relative (0-1)
    y: number; // Valeur relative (0-1)
    w?: number; // Largeur relative (0-1) pour les rectangles
    h?: number; // Hauteur relative (0-1) pour les rectangles
    r?: number; // Rayon relatif (0-1) pour les cercles
  };
  title: string;
  description?: string;
  number?: number | null;
  display?: 'normal' | 'masked' | 'blurred' | 'transparent'; // Statut d'affichage individuel
}

// Types pour les modes d'exercice
export type ExerciseMode = 'edit' | 'find' | 'label' | 'preview' | 'legend';

// Types pour les options d'affichage
export interface DisplayOptions {
  zoneDisplay: 'normal' | 'masked' | 'blurred' | 'transparent'; // Statut d'affichage par défaut
}

interface InteractiveImageProps {
  imageUrl: string;
  hotspots: Hotspot[];
  mode: ExerciseMode;
  displayOptions: DisplayOptions;
  onHotspotCreate?: (hotspot: Hotspot) => void;
  onHotspotUpdate?: (hotspot: Hotspot) => void;
  onHotspotDelete?: (hotspotId: string) => void;
  onExerciseComplete?: (score: number, total: number) => void;
}

const InteractiveImage: React.FC<InteractiveImageProps> = ({
  imageUrl,
  hotspots,
  mode,
  displayOptions,
  onHotspotCreate,
  onHotspotUpdate,
  onHotspotDelete,
  onExerciseComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomContainerRef = useRef<HTMLDivElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [currentShape] = useState<'rect' | 'circle'>('rect');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ x: number, y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [currentFindTarget, setCurrentFindTarget] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastPanPoint, setLastPanPoint] = useState<{x: number, y: number} | null>(null);

  // Charger l'image avec préchargement et optimisation
  useEffect(() => {
    // Afficher un message de chargement ou un placeholder pendant le chargement
    setImage(null);
    
    const img = new Image();
    
    // Définir onload avant de définir src pour éviter les problèmes de timing
    img.onload = () => {
      // Mettre à jour l'état avec l'image chargée
      setImage(img);
      
      // Ajuster la taille du canvas en fonction de l'image
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const scale = containerWidth / img.width;
        setCanvasSize({
          width: containerWidth,
          height: img.height * scale
        });
      }
    };
    
    // Définir les attributs de performance
    img.decoding = 'async';
    img.loading = 'eager';
    
    // Déclencher le chargement de l'image
    img.src = imageUrl;
  }, [imageUrl]);

  // Redessiner le canvas lorsque les données changent
  useEffect(() => {
    const drawCanvas = () => {
    if (!canvasRef.current || !image) return;
    
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Améliorer la qualité de l'image
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Dessiner l'image (une seule fois)
    ctx.drawImage(image, 0, 0, canvasElement.width, canvasElement.height);
    
    // Dessiner les hotspots
    hotspots.forEach(hotspot => {
      const { x, y, w, h, r } = hotspot.coords;
      const isSelected = hotspot.id === selectedHotspotId;
      
      // Dessiner les poignées de redimensionnement si la zone est sélectionnée
      if (isSelected && mode === 'edit' && hotspot.shape === 'rect' && typeof w === 'number' && typeof h === 'number') {
        const absX = x * canvasElement.width;
        const absY = y * canvasElement.height;
        const absW = w * canvasElement.width;
        const absH = h * canvasElement.height;
        
        // Dessiner les poignées aux quatre coins
        const handleSize = 8;
        ctx.fillStyle = '#ff4081';
        
        // Coin supérieur gauche
        ctx.fillRect(absX - handleSize/2, absY - handleSize/2, handleSize, handleSize);
        
        // Coin supérieur droit
        ctx.fillRect(absX + absW - handleSize/2, absY - handleSize/2, handleSize, handleSize);
        
        // Coin inférieur gauche
        ctx.fillRect(absX - handleSize/2, absY + absH - handleSize/2, handleSize, handleSize);
        
        // Coin inférieur droit
        ctx.fillRect(absX + absW - handleSize/2, absY + absH - handleSize/2, handleSize, handleSize);
      }
      
      // Définir le style en fonction du mode d'affichage (individuel ou global)
      let fillColor = 'rgba(128, 128, 128, 0.3)'; // Gris transparent
      let strokeColor = '#FF0000'; // Rouge vif pour les contours
      
      // Utiliser le statut d'affichage individuel de la zone s'il existe, sinon utiliser le statut global
      const zoneDisplay = hotspot.display || displayOptions.zoneDisplay;
      
      switch (zoneDisplay) {
        case 'masked':
          fillColor = 'rgba(0, 0, 0, 1)'; // Noir mat complètement opaque
          strokeColor = 'black';
          break;
        case 'transparent':
          fillColor = 'rgba(128, 128, 128, 0.1)';
          break;
        case 'normal':
        default:
          // Garder les valeurs par défaut
          break;
      }
      
      if (isSelected && mode === 'edit') {
        strokeColor = '#FF0000'; // Rouge vif même quand sélectionné
        fillColor = 'rgba(128, 128, 128, 0.5)'; // Gris un peu plus opaque quand sélectionné
      }
      
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 2 : 1;
      
      // Dessiner la forme
      if (hotspot.shape === 'rect' && w !== undefined && h !== undefined) {
        const absX = x * canvasElement.width;
        const absY = y * canvasElement.height;
        const absW = w * canvasElement.width;
        const absH = h * canvasElement.height;
        
        ctx.beginPath();
        ctx.rect(absX, absY, absW, absH);
        ctx.fill();
        ctx.stroke();
        
        // Dessiner le numéro si présent
        if (hotspot.number !== undefined && hotspot.number !== null) {
          // Dessiner un cercle rouge autour du numéro
          const textX = absX + absW / 2;
          const textY = absY + absH / 2;
          const circleRadius = 14;
          
          // Cercle de fond
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(textX, textY, circleRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Texte du numéro
          ctx.fillStyle = 'white';
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(hotspot.number.toString(), textX, textY);
        }
      } else if (hotspot.shape === 'circle' && r !== undefined) {
        const absX = x * canvasElement.width;
        const absY = y * canvasElement.height;
        const absR = r * Math.min(canvasElement.width, canvasElement.height);
        
        ctx.beginPath();
        ctx.arc(absX, absY, absR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Dessiner le numéro si présent
        if (hotspot.number !== undefined && hotspot.number !== null) {
          // Dessiner un cercle rouge autour du numéro
          const circleRadius = 14;
          
          // Cercle de fond
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(absX, absY, circleRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Texte du numéro
          ctx.fillStyle = 'white';
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(hotspot.number.toString(), absX, absY);
        }
      }
    });
    
    // Dessiner la forme en cours de création
    if (isDrawing && startPoint && endPoint) {
      ctx.setLineDash([5, 5]);
      ctx.fillStyle = 'rgba(255, 193, 7, 0.3)';
      ctx.strokeStyle = '#bd8c0f';
      ctx.lineWidth = 1;
      
      if (currentShape === 'rect') {
        const x = Math.min(startPoint.x, endPoint.x);
        const y = Math.min(startPoint.y, endPoint.y);
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);
        
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.fill();
        ctx.stroke();
      } else {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    }
  };
  
  drawCanvas();
  }, [image, hotspots, selectedHotspotId, isDrawing, startPoint, endPoint, currentShape, mode, displayOptions, zoomLevel]);

  // Ajuster la taille du canvas lors du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current || !image) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerWidth * (image.height / image.width);
      
      // Définir les dimensions du canvas en pixels réels
      canvasRef.current.width = containerWidth;
      canvasRef.current.height = containerHeight;
      setCanvasSize({ width: containerWidth, height: containerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Appliquer immédiatement
    
    return () => window.removeEventListener('resize', handleResize);
  }, [image]);
  
  // Nous n'avons plus besoin de cet effet car nous appliquons la transformation directement dans le style
  // du composant pour éviter les mises à jour DOM inutiles

  // Convertir les coordonnées absolues en coordonnées relatives
  const toRelativeCoords = (x: number, y: number, w?: number, h?: number, r?: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    
    if (currentShape === 'rect' && w !== undefined && h !== undefined) {
      return {
        x: x / canvas.width,
        y: y / canvas.height,
        w: w / canvas.width,
        h: h / canvas.height
      };
    } else if (r !== undefined) {
      return {
        x: x / canvas.width,
        y: y / canvas.height,
        r: r / Math.min(canvas.width, canvas.height)
      };
    }
    
    return {
      x: x / canvas.width,
      y: y / canvas.height
    };
  };

  // Vérifier si un point est sur une poignée de redimensionnement
  const getResizeHandle = (x: number, y: number, hotspot: Hotspot) => {
    if (!canvasRef.current || hotspot.shape !== 'rect') return null;
    
    const { coords } = hotspot;
    if (typeof coords.w !== 'number' || typeof coords.h !== 'number') return null;
    
    const canvas = canvasRef.current;
    
    const absX = coords.x * canvas.width;
    const absY = coords.y * canvas.height;
    const absW = coords.w * canvas.width;
    const absH = coords.h * canvas.height;
    
    const handleSize = 8;
    const handleRadius = handleSize / 2;
    
    // Vérifier chaque poignée
    // Coin supérieur gauche
    if (Math.abs(x - absX) <= handleRadius && Math.abs(y - absY) <= handleRadius) {
      return 'topLeft';
    }
    
    // Coin supérieur droit
    if (Math.abs(x - (absX + absW)) <= handleRadius && Math.abs(y - absY) <= handleRadius) {
      return 'topRight';
    }
    
    // Coin inférieur gauche
    if (Math.abs(x - absX) <= handleRadius && Math.abs(y - (absY + absH)) <= handleRadius) {
      return 'bottomLeft';
    }
    
    // Coin inférieur droit
    if (Math.abs(x - (absX + absW)) <= handleRadius && Math.abs(y - (absY + absH)) <= handleRadius) {
      return 'bottomRight';
    }
    
    return null;
  };
  
  // Vérifier si un point est à l'intérieur d'un hotspot
  const isPointInHotspot = (x: number, y: number, hotspot: Hotspot) => {
    if (!canvasRef.current) return false;
    
    const canvas = canvasRef.current;
    const { coords, shape } = hotspot;
    
    const absX = coords.x * canvas.width;
    const absY = coords.y * canvas.height;
    
    if (shape === 'rect' && coords.w !== undefined && coords.h !== undefined) {
      const absW = coords.w * canvas.width;
      const absH = coords.h * canvas.height;
      
      return x >= absX && x <= absX + absW && y >= absY && y <= absY + absH;
    } else if (shape === 'circle' && coords.r !== undefined) {
      const absR = coords.r * Math.min(canvas.width, canvas.height);
      const dx = x - absX;
      const dy = y - absY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance <= absR;
    }
    
    return false;
  };

  // Trouver le hotspot à une position donnée
  const findHotspotAtPosition = (x: number, y: number) => {
    return hotspots.find(hotspot => isPointInHotspot(x, y, hotspot));
  };

  // Gérer le début du dessin, du déplacement ou du redimensionnement
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'edit' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Vérifier d'abord si on clique sur une poignée de redimensionnement
    if (selectedHotspotId) {
      const selectedHotspot = hotspots.find(h => h.id === selectedHotspotId);
      if (selectedHotspot) {
        const handle = getResizeHandle(x, y, selectedHotspot);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setStartPoint({ x, y });
          return;
        }
      }
    }
    
    // Vérifier si on clique sur un hotspot existant
    const clickedHotspot = findHotspotAtPosition(x, y);
    
    if (clickedHotspot) {
      setSelectedHotspotId(clickedHotspot.id);
      setIsDragging(true);
      
      // Calculer l'offset pour le déplacement
      const hotspotX = clickedHotspot.coords.x * canvas.width;
      const hotspotY = clickedHotspot.coords.y * canvas.height;
      setDragOffset({ x: x - hotspotX, y: y - hotspotY });
    } else {
      setSelectedHotspotId(null);
      setIsDrawing(true);
      setStartPoint({ x, y });
      setEndPoint({ x, y });
    }
  };

  // Gérer le déplacement de la souris pendant le dessin, le déplacement ou le redimensionnement
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDrawing) {
      // Mode dessin d'une nouvelle zone
      setEndPoint({ x, y });
    } else if (isDragging && selectedHotspotId && dragOffset) {
      // Mode déplacement d'une zone existante
      const selectedHotspot = hotspots.find(h => h.id === selectedHotspotId);
      if (selectedHotspot && onHotspotUpdate) {
        // Calculer les nouvelles coordonnées relatives
        const newX = (x - dragOffset.x) / canvas.width;
        const newY = (y - dragOffset.y) / canvas.height;
        
        // Mettre à jour les coordonnées du hotspot
        const updatedHotspot = {
          ...selectedHotspot,
          coords: {
            ...selectedHotspot.coords,
            x: Math.max(0, Math.min(1, newX)),
            y: Math.max(0, Math.min(1, newY))
          }
        };
        
        onHotspotUpdate(updatedHotspot);
      }
    } else if (isResizing && selectedHotspotId && resizeHandle && startPoint) {
      // Mode redimensionnement d'une zone existante
      const selectedHotspot = hotspots.find(h => h.id === selectedHotspotId);
      if (selectedHotspot && selectedHotspot.shape === 'rect' && 
          typeof selectedHotspot.coords.w === 'number' && typeof selectedHotspot.coords.h === 'number' && 
          onHotspotUpdate) {
        
        // Obtenir les coordonnées actuelles
        let { x: rectX, y: rectY, w: rectW, h: rectH } = selectedHotspot.coords;
        
        // Convertir en coordonnées absolues pour les calculs
        let absX = rectX * canvas.width;
        let absY = rectY * canvas.height;
        let absW = rectW * canvas.width;
        let absH = rectH * canvas.height;
        
        // Mettre à jour les dimensions en fonction de la poignée utilisée
        switch (resizeHandle) {
          case 'topLeft':
            absX = x;
            absY = y;
            absW = (rectX * canvas.width + rectW * canvas.width) - x;
            absH = (rectY * canvas.height + rectH * canvas.height) - y;
            break;
          case 'topRight':
            absY = y;
            absW = x - (rectX * canvas.width);
            absH = (rectY * canvas.height + rectH * canvas.height) - y;
            break;
          case 'bottomLeft':
            absX = x;
            absW = (rectX * canvas.width + rectW * canvas.width) - x;
            absH = y - (rectY * canvas.height);
            break;
          case 'bottomRight':
            absW = x - (rectX * canvas.width);
            absH = y - (rectY * canvas.height);
            break;
        }
        
        // S'assurer que les dimensions sont positives
        if (absW < 10) absW = 10;
        if (absH < 10) absH = 10;
        
        // Si la position a changé, mettre à jour les coordonnées
        if (resizeHandle === 'topLeft' || resizeHandle === 'bottomLeft') {
          if (absX > rectX * canvas.width + rectW * canvas.width - 10) {
            absX = rectX * canvas.width + rectW * canvas.width - 10;
          }
        }
        
        if (resizeHandle === 'topLeft' || resizeHandle === 'topRight') {
          if (absY > rectY * canvas.height + rectH * canvas.height - 10) {
            absY = rectY * canvas.height + rectH * canvas.height - 10;
          }
        }
        
        // Convertir en coordonnées relatives
        const newX = absX / canvas.width;
        const newY = absY / canvas.height;
        const newW = absW / canvas.width;
        const newH = absH / canvas.height;
        
        // Mettre à jour le hotspot
        const updatedHotspot = {
          ...selectedHotspot,
          coords: {
            ...selectedHotspot.coords,
            x: Math.max(0, Math.min(1 - newW, newX)),
            y: Math.max(0, Math.min(1 - newH, newY)),
            w: Math.min(1 - newX, newW),
            h: Math.min(1 - newY, newH)
          }
        };
        
        onHotspotUpdate(updatedHotspot);
      } else if (selectedHotspot && selectedHotspot.shape === 'circle' && 
                selectedHotspot.coords.r !== undefined && onHotspotUpdate) {
        // Redimensionnement d'un cercle
        const centerX = selectedHotspot.coords.x * canvas.width;
        const centerY = selectedHotspot.coords.y * canvas.height;
        // Nous utilisons déjà canvas dans les calculs, pas besoin de variable supplémentaire
        
        // Calculer la distance entre le centre et la position actuelle de la souris
        const dx = x - centerX;
        const dy = y - centerY;
        const newRadius = Math.sqrt(dx * dx + dy * dy);
        
        // Mettre à jour le rayon (minimum 10 pixels)
        const minRadius = 10;
        const maxRadius = Math.min(centerX, centerY, canvas.width - centerX, canvas.height - centerY);
        const clampedRadius = Math.max(minRadius, Math.min(maxRadius, newRadius));
        
        // Convertir en valeur relative
        const relativeRadius = clampedRadius / Math.min(canvas.width, canvas.height);
        
        // Mettre à jour le hotspot
        const updatedHotspot = {
          ...selectedHotspot,
          coords: {
            ...selectedHotspot.coords,
            r: relativeRadius
          }
        };
        
        onHotspotUpdate(updatedHotspot);
      }
    }
  };

  // Gérer la fin du dessin, du déplacement ou du redimensionnement
  const handleMouseUp = () => {
    // Réinitialiser tous les états d'interaction
    setIsDragging(false);
    setDragOffset(null);
    setIsResizing(false);
    setResizeHandle(null);
    
    if (!isDrawing || !startPoint || !endPoint || !canvasRef.current) {
      setIsDrawing(false);
      return;
    }
    
    const canvasElement = canvasRef.current;
    
    // Créer un nouveau hotspot
    if (currentShape === 'rect') {
      const x = Math.min(startPoint.x, endPoint.x);
      const y = Math.min(startPoint.y, endPoint.y);
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);
      
      // Vérifier si le hotspot a une taille minimale
      if (width > 10 && height > 10) {
        const relCoords = toRelativeCoords(x, y, width, height);
        
        const newHotspot: Hotspot = {
          id: Date.now().toString(),
          shape: 'rect',
          coords: {
            x: relCoords.x,
            y: relCoords.y,
            w: relCoords.w,
            h: relCoords.h
          },
          title: `Zone ${hotspots.length + 1}`
        };
        
        if (onHotspotCreate) {
          onHotspotCreate(newHotspot);
        }
      }
    } else {
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      // Vérifier si le hotspot a une taille minimale
      if (radius > 10) {
        const relCoords = toRelativeCoords(startPoint.x, startPoint.y, undefined, undefined, radius);
        
        const newHotspot: Hotspot = {
          id: Date.now().toString(),
          shape: 'circle',
          coords: {
            x: relCoords.x,
            y: relCoords.y,
            r: relCoords.r
          },
          title: `Zone ${hotspots.length + 1}`
        };
        
        if (onHotspotCreate) {
          onHotspotCreate(newHotspot);
        }
      }
    }
    
    setIsDrawing(false);
    setStartPoint(null);
    setEndPoint(null);
  };

  // Gérer le clic sur le canvas (pour le mode "find")
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'find' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Trouver le hotspot cliqué
    const clickedHotspot = findHotspotAtPosition(x, y);
    
    if (clickedHotspot) {
      // Vérifier si c'est le bon hotspot à trouver
      const orderedHotspots = [...hotspots].sort((a, b) => 
        (a.number || Infinity) - (b.number || Infinity)
      );
      
      if (orderedHotspots[currentFindTarget]?.id === clickedHotspot.id) {
        setFeedback({ message: 'Correct !', isCorrect: true });
        setScore(prev => prev + 1);
        
        // Passer au prochain hotspot à trouver
        if (currentFindTarget < orderedHotspots.length - 1) {
          setTimeout(() => {
            setCurrentFindTarget(prev => prev + 1);
            setFeedback(null);
          }, 1000);
        } else {
          // Exercice terminé
          setTimeout(() => {
            if (onExerciseComplete) {
              onExerciseComplete(score + 1, orderedHotspots.length);
            }
            setFeedback(null);
          }, 1000);
        }
      } else {
        setFeedback({ message: 'Incorrect, essayez encore', isCorrect: false });
        setTimeout(() => setFeedback(null), 1000);
      }
    }
  };

  // Supprimer un hotspot
  const handleDeleteHotspot = () => {
    if (selectedHotspotId && onHotspotDelete) {
      onHotspotDelete(selectedHotspotId);
      setSelectedHotspotId(null);
    }
  };

  // Afficher le titre du hotspot à trouver en mode "find"
  const getCurrentTargetTitle = () => {
    const orderedHotspots = [...hotspots].sort((a, b) => 
      (a.number || Infinity) - (b.number || Infinity)
    );
    
    return orderedHotspots[currentFindTarget]?.title || '';
  };

  // Rendu conditionnel en fonction du mode
  const renderModeSpecificUI = () => {
    switch (mode) {
      case 'edit':
        return (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedHotspotId && (
              <button 
                className="px-3 py-1 rounded bg-red-500 text-white ml-auto"
                onClick={handleDeleteHotspot}
              >
                Supprimer
              </button>
            )}
          </div>
        );
      
      case 'find':
        return (
          <div className="mb-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="font-medium">Trouvez sur l'image : <span className="text-[#bd8c0f]">{getCurrentTargetTitle()}</span></p>
              <p className="text-sm text-gray-600 mt-1">Cliquez sur la zone correspondante</p>
            </div>
            {feedback && (
              <div className={`mt-2 p-2 rounded ${feedback.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {feedback.message}
              </div>
            )}
            <div className="mt-2 text-sm">
              Score: {score}/{hotspots.length}
            </div>
          </div>
        );
      
      case 'legend':
        // À implémenter : système de drag & drop pour les légendes
        return (
          <div className="mb-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="font-medium">Placez les légendes sur l'image</p>
              <p className="text-sm text-gray-600 mt-1">Glissez-déposez chaque étiquette sur la zone correspondante</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {hotspots.map(hotspot => (
                <div 
                  key={hotspot.id}
                  className="px-3 py-1 bg-[#bd8c0f] text-white rounded cursor-move"
                  draggable
                >
                  {hotspot.title}
                </div>
              ))}
            </div>
          </div>
        );
      case 'preview':
        return (
          <div className="mb-4">
            <div className="p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Analysez l'image et retrouvez les éléments</h2>
              <p className="text-gray-600 mb-4">Identifiez le titre et la description (si demandée) de chaque zone numérotée sur l'image.</p>
              
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 mb-2">Zones à identifier :</h3>
                <div className="space-y-2">
                  {hotspots
                    .filter(h => h.number !== undefined)
                    .sort((a, b) => (a.number || 0) - (b.number || 0))
                    .map(hotspot => (
                      <div key={hotspot.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                          {hotspot.number}
                        </div>
                        <div className="flex-grow">
                          <input type="text" placeholder="Votre réponse" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="interactive-image-container">
      {/* Contrôles spécifiques au mode */}
      {renderModeSpecificUI()}
      
      {/* Conteneur du canvas avec zoom */}
      <div 
        ref={containerRef} 
        className="relative border border-gray-300 rounded-md overflow-hidden"
        style={{ 
          height: canvasSize.height ? `${canvasSize.height}px` : 'auto',
          maxWidth: '100%',
          willChange: 'contents' // Améliore les performances de rendu
        }}
      >
        <div 
          ref={zoomContainerRef} 
          className="w-full h-full transition-transform duration-100 origin-top-left"
          style={{ 
            willChange: 'transform', // Améliore les performances de transformation
            backfaceVisibility: 'hidden', // Optimisation supplémentaire
            transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`
          }}
        >
          <canvas 
            ref={canvasRef}
            onMouseDown={(e) => {
              // Activer le mode déplacement avec Alt+clic gauche ou clic du milieu
              if (e.buttons === 4 || (e.buttons === 1 && e.altKey)) {
                setIsPanning(true);
                setLastPanPoint({ x: e.clientX, y: e.clientY });
                e.preventDefault();
              } else {
                handleMouseDown(e);
              }
            }}
            onMouseMove={(e) => {
              if (isPanning && lastPanPoint) {
                // Déplacement de l'image
                const dx = (e.clientX - lastPanPoint.x) / zoomLevel;
                const dy = (e.clientY - lastPanPoint.y) / zoomLevel;
                setPanPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                setLastPanPoint({ x: e.clientX, y: e.clientY });
                e.preventDefault();
              } else {
                handleMouseMove(e);
              }
            }}
            onMouseUp={(_) => {
              if (isPanning) {
                setIsPanning(false);
                setLastPanPoint(null);
              } else {
                // Appeler handleMouseUp sans arguments
                handleMouseUp();
              }
            }}
            onMouseLeave={(_) => {
              if (isPanning) {
                setIsPanning(false);
                setLastPanPoint(null);
              } else {
                // Appeler handleMouseUp sans arguments
                handleMouseUp();
              }
            }}
            // Suppression du gestionnaire onDoubleClick pour éviter les conflits
            onClick={mode === 'find' ? handleCanvasClick : undefined}
            className="block w-full cursor-move"
          />
        </div>
        
        {/* Contrôles de zoom et instructions */}
        <div className="absolute bottom-2 right-2 flex items-center bg-white bg-opacity-70 p-1 rounded-md shadow-md">
          <span className="mr-2 text-xs text-gray-700">Alt+clic pour déplacer</span>
          <button 
            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-md"
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            title="Zoom arrière"
          >
            <span className="text-xl">−</span>
          </button>
          <span className="mx-2 text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
          <button 
            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-md"
            onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
            title="Zoom avant"
          >
            <span className="text-xl">+</span>
          </button>
        </div>
      </div>
      
      {/* Formulaire d'édition du hotspot sélectionné */}
      {mode === 'edit' && selectedHotspotId && (
        <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-white">
          {hotspots.filter(h => h.id === selectedHotspotId).map(hotspot => {
            // Déterminer si c'est une zone de légende ou de masquage
            const isLegendZone = hotspot.number !== undefined && hotspot.number !== null;
            
            return (
              <div key={hotspot.id}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    {isLegendZone ? (
                      <>
                        <span className="flex items-center justify-center w-6 h-6 bg-[#bd8c0f] text-white rounded-full text-xs font-bold">
                          {hotspot.number}
                        </span>
                        <span>Zone à légender</span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center justify-center w-6 h-6 bg-gray-700 text-white rounded-full text-xs font-bold">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                        <span>Zone de masquage</span>
                      </>
                    )}
                  </h3>
                  <button 
                    onClick={() => {
                      if (onHotspotDelete) {
                        onHotspotDelete(hotspot.id);
                        setSelectedHotspotId(null);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre {isLegendZone && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={hotspot.title}
                      onChange={(e) => onHotspotUpdate && onHotspotUpdate({ ...hotspot, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={isLegendZone ? "Nom de l'élément à légender" : "Zone masquée"}
                    />
                    {isLegendZone && (
                      <p className="text-xs text-gray-500 mt-1">Ce titre sera affiché comme légende à placer par l'apprenant</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description {isLegendZone && <span className="text-gray-400">(optionnelle)</span>}
                    </label>
                    <textarea
                      value={hotspot.description || ''}
                      onChange={(e) => onHotspotUpdate && onHotspotUpdate({ ...hotspot, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder={isLegendZone ? "Indice ou explication supplémentaire" : "Pourquoi cette zone est masquée"}
                    />
                  </div>
                  
                  {isLegendZone ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={hotspot.number !== undefined && hotspot.number !== null ? hotspot.number : ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                          min="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Numéro attribué automatiquement à cet élément</p>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Affichage de l'élément
                        </label>
                        <select
                          value={hotspot.display || 'normal'}
                          onChange={(e) => {
                            const value = e.target.value as 'normal' | 'masked';
                            onHotspotUpdate && onHotspotUpdate({ ...hotspot, display: value });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="normal">Normal (fond transparent)</option>
                          <option value="masked">Masqué (noir opaque)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Tu peux masquer le contenu de l'élément si nécessaire</p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type de masquage <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={hotspot.display || 'masked'}
                        onChange={() => {
                          onHotspotUpdate && onHotspotUpdate({ ...hotspot, display: 'masked' });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="masked">Masqué (noir opaque)</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Les contrôles de position et taille pour les rectangles ont été supprimés */}
                  
                  {/* Les contrôles de position et taille pour les cercles ont été supprimés */}
                </div>
              </div>
            );
          })}
          
          {!selectedHotspotId && (
            <div className="text-center py-4 text-gray-500">
              <p>Cliquez sur une zone pour la modifier</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveImage;
