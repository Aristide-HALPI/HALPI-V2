import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface HiddenImageProps {
  imageUrl: string;
  alt: string;
}

export function HiddenImage({ imageUrl, alt }: HiddenImageProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group">
      {isRevealed ? (
        <>
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-contain"
          />
          <button
            onClick={() => setIsRevealed(false)}
            className="absolute top-2 right-2 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Masquer l'image"
          >
            <EyeOff className="w-5 h-5 text-gray-600" />
          </button>
        </>
      ) : (
        <div
          onClick={() => setIsRevealed(true)}
          className="w-full h-full flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">Cliquez pour révéler l'image</span>
        </div>
      )}
    </div>
  );
}
