import React, { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Button from './common/Button';
import AIService from '../services/ai/AIService';
import { AIInteractionType } from '../api/ai/routes/fabrileInteraction';

interface AIEvaluationButtonProps {
  // Type d'interaction IA à utiliser
  interactionType: AIInteractionType;
  
  // Contenu à évaluer (peut être un objet ou une chaîne)
  content: any;
  
  // Fonction appelée lorsque l'évaluation est terminée
  onEvaluationComplete: (result: any) => void;
  
  // Texte du bouton
  buttonText?: string;
  
  // Classe CSS additionnelle
  className?: string;
  
  // Désactiver le bouton
  disabled?: boolean;
}

/**
 * Bouton réutilisable pour déclencher une évaluation IA
 */
const AIEvaluationButton: React.FC<AIEvaluationButtonProps> = ({
  interactionType,
  content,
  onEvaluationComplete,
  buttonText = "Évaluer avec l'IA",
  className = "",
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleEvaluation = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Récupérer l'ID de l'organisation depuis les variables d'environnement
      const organizationId = import.meta.env.VITE_FABRILE_ORGANIZATION_ID;
      
      if (!organizationId) {
        throw new Error("ID d'organisation Fabrile manquant dans les variables d'environnement");
      }
      
      // Appeler le service IA avec le type d'interaction approprié
      const result = await AIService.interact(
        interactionType,
        content,
        organizationId
      );
      
      // Indiquer le succès
      setSuccess(true);
      
      // Appeler le callback avec le résultat
      onEvaluationComplete(result);
    } catch (err) {
      console.error("Erreur lors de l'évaluation IA:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'évaluation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        onClick={handleEvaluation}
        disabled={disabled || isLoading}
        className={`flex items-center gap-2 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : success ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          null
        )}
        {buttonText}
      </Button>
      
      {error && (
        <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
};

export default AIEvaluationButton;
