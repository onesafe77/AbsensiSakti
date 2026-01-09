import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  index?: number;
  showClickHint?: boolean;
  accentColor?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = "w-full h-full object-cover",
  fallbackClassName = "w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700",
  index,
  showClickHint = false,
  accentColor = "blue"
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div className={fallbackClassName}>
        <ImageIcon className="h-8 w-8 mb-1" />
        {index !== undefined && (
          <span className="text-xs">Foto {index + 1}</span>
        )}
        {showClickHint && (
          <span className={`text-[10px] text-${accentColor}-500`}>Klik untuk buka</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

interface PhotoGalleryItemProps {
  photo: string;
  index: number;
  onDelete?: () => void;
  isDeleting?: boolean;
  accentColor?: string;
}

export function PhotoGalleryItem({
  photo,
  index,
  onDelete,
  isDeleting,
  accentColor = "blue"
}: PhotoGalleryItemProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [photo]);

  return (
    <div className="relative group">
      <a
        href={photo}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-32 rounded-lg border bg-gray-100 dark:bg-gray-700 overflow-hidden"
      >
        {hasError ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="h-8 w-8 mb-1" />
            <span className="text-xs">Foto {index + 1}</span>
            <span className={`text-[10px] text-${accentColor}-500`}>Klik untuk buka</span>
          </div>
        ) : (
          <img
            src={photo}
            alt={`Foto ${index + 1}`}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        )}
      </a>
      {onDelete && (
        <button
          type="button"
          className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface PhotoThumbnailProps {
  photo: string;
  index: number;
  onClick?: () => void;
}

export function PhotoThumbnail({ photo, index, onClick }: PhotoThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [photo]);

  return (
    <div
      className="h-12 w-12 rounded border cursor-pointer hover:opacity-80 bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden"
      onClick={onClick}
    >
      {hasError ? (
        <div className="h-full w-full flex items-center justify-center text-gray-400">
          <ImageIcon className="h-5 w-5" />
        </div>
      ) : (
        <img
          src={photo}
          alt={`Foto ${index + 1}`}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
