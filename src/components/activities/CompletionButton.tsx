import { ArrowRight } from 'lucide-react';

interface CompletionButtonProps {
  onComplete: () => Promise<void>;
  isCompleting?: boolean;
}

export function CompletionButton({ onComplete, isCompleting = false }: CompletionButtonProps) {
  return (
    <button
      onClick={onComplete}
      disabled={isCompleting}
      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {isCompleting ? 'Finalisation...' : 'Terminer l\'exercice'}
      <ArrowRight className="w-5 h-5" />
    </button>
  );
}