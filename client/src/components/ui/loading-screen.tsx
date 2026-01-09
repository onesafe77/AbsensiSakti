import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  isLoading: boolean;
  onComplete?: () => void;
  className?: string;
}

export function LoadingScreen({ isLoading, onComplete, className }: LoadingScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    let timeoutId: NodeJS.Timeout;

    const startLoading = () => {
      timeoutId = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setFadeOut(false);
          onComplete?.();
        }, 300);
      }, 1500);
    };

    startLoading();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoading, onComplete]);

  if (!isLoading && !fadeOut) return null;

  const brandName = "OneTalent";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-white dark:bg-gray-900",
        "transition-opacity duration-300 ease-in-out",
        fadeOut ? "opacity-0" : "opacity-100",
        className
      )}
    >
      <div className="flex flex-col items-center space-y-8">
        
        {/* Bouncing OneTalent letters */}
        <div className="flex items-end justify-center">
          {brandName.split('').map((letter, index) => (
            <div key={index} className="flex flex-col items-center">
              <span
                className="text-4xl font-bold text-[#E53935] animate-bounce-dot"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {letter}
              </span>
              <div
                className="w-4 h-1 rounded-full bg-red-300/40 mt-1 animate-shadow-pulse"
                style={{ animationDelay: `${index * 0.08}s` }}
              />
            </div>
          ))}
        </div>

        {/* Subtitle */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            Kerja Aman Keselamatan Number One
          </p>
        </div>

        {/* Loading text */}
        <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">
          Memuat aplikasi...
        </p>
        
      </div>
    </div>
  );
}