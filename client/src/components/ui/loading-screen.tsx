import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  isLoading: boolean;
  onComplete?: () => void;
  className?: string;
}

export function LoadingScreen({ isLoading, onComplete, className }: LoadingScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const fullText = "OneTalent";

  // Typing animation effect - one time only (no loop)
  useEffect(() => {
    if (!isLoading) return;

    let charIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const typeChar = () => {
      if (charIndex < fullText.length) {
        setDisplayText(fullText.substring(0, charIndex + 1));
        charIndex++;
        timeoutId = setTimeout(typeChar, 50); // Fast typing speed
      }
    };

    typeChar();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoading]);

  // Handle completion
  useEffect(() => {
    if (!isLoading || !onComplete) return;

    const timeoutId = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setFadeOut(false);
        onComplete?.();
      }, 200);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [isLoading, onComplete]);

  if (!isLoading && !fadeOut) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-gray-900 transition-opacity duration-300",
        fadeOut && "opacity-0",
        className
      )}
    >
      {/* Spinner */}
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6" />

      {/* Typing Text */}
      <h1 className="text-3xl font-bold text-red-600 mb-2 min-w-[180px] text-center">
        {displayText}
        <span className="animate-pulse">|</span>
      </h1>

      {/* Subtitle */}
      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
        Memuat Aplikasi...
      </p>
    </div>
  );
}