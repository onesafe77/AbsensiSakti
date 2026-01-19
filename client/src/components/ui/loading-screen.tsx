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

    // If onComplete is not provided, this is a persistent loader (e.g. Suspense/Protected fallback)
    // Do NOT fade out automatically. Just stay visible until unmounted by parent.
    if (!onComplete) return;

    let timeoutId: NodeJS.Timeout;

    const startLoading = () => {
      timeoutId = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setFadeOut(false);
          onComplete?.();
        }, 200); // Reduce fade out delay
      }, 800); // Reduce from 1500ms to 800ms for faster loading
    };

    startLoading();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoading, onComplete]);

  if (!isLoading && !fadeOut) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
      <h1 className="text-2xl font-bold text-red-600 mb-2">OneTalent</h1>
      <p className="text-gray-500 font-medium">Memuat Aplikasi...</p>
    </div>
  );
}