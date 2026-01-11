import { useEffect, useRef, useState, Suspense, lazy } from "react";

// Lazy load Spline to avoid initial bundle weight
const Spline = lazy(() => import('@splinetool/react-spline'));

interface ParticleBackgroundProps {
    variant?: 'landing' | 'login';
    className?: string;
    splineUrl?: string;
}

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    color: string;
}

export function ParticleBackground({ variant = 'landing', className = '', splineUrl }: ParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [splineError, setSplineError] = useState(false);

    // Initial mobile check
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Canvas Effect (Fallback or Mobile)
    useEffect(() => {
        // If we are using Spline on Desktop and it hasn't errored, don't run canvas
        if (variant === 'landing' && splineUrl && !isMobile && !splineError) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const initParticles = () => {
            particles = [];
            // Reduce count heavily for mobile
            const particleCount = variant === 'landing' ? (isMobile ? 20 : 60) : 40;
            const blues = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];

            for (let i = 0; i < particleCount; i++) {
                let x, color;
                if (variant === 'landing') {
                    if (Math.random() > 0.3) {
                        x = (0.5 + Math.random() * 0.5) * canvas.width;
                    } else {
                        x = Math.random() * canvas.width;
                    }
                    color = blues[Math.floor(Math.random() * blues.length)];
                } else {
                    x = Math.random() * canvas.width;
                    color = Math.random() > 0.8 ? '#ef4444' : '#94a3b8';
                }

                particles.push({
                    x,
                    y: Math.random() * canvas.height,
                    size: Math.random() * (variant === 'landing' ? 4 : 2) + 1,
                    speedX: Math.random() * 0.4 - 0.2,
                    speedY: Math.random() * 0.4 - 0.2,
                    opacity: Math.random() * 0.6 + 0.1,
                    color
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Subtle parallax for fallback
            const targetParallaxX = (mouseRef.current.x - canvas.width / 2) * 0.02;
            const targetParallaxY = (mouseRef.current.y - canvas.height / 2) * 0.02;

            particles.forEach((particle) => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                const drawX = particle.x + (targetParallaxX * particle.size * 0.1);
                const drawY = particle.y + (targetParallaxY * particle.size * 0.1);

                // Simple masking for text readability
                const dx = drawX - canvas.width / 2;
                const dy = drawY - canvas.height / 2;
                const dist = Math.sqrt(dx * dx + dy * dy);
                let maskFactor = 1.0;

                if (variant === 'landing' && dist < 300) {
                    maskFactor = Math.max(0.1, dist / 300);
                }

                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                ctx.beginPath();
                ctx.arc(drawX, drawY, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.opacity * maskFactor;
                ctx.fill();
                ctx.globalAlpha = 1.0;
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [variant, isMobile, splineUrl, splineError]);

    // Render Logic
    if (variant === 'landing' && splineUrl && !isMobile && !splineError) {
        return (
            <div className={`fixed inset-0 z-0 w-full h-full pointer-events-none overflow-hidden ${className}`}>
                <Suspense fallback={<canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />}>
                    <Spline
                        scene={splineUrl}
                        className="w-full h-full"
                        onLoad={() => console.log('Spline loaded')}
                        onError={() => setSplineError(true)}
                    />
                </Suspense>
            </div>
        );
    }

    // Default / Fallback / Mobile Canvas
    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 pointer-events-none z-0 ${className}`}
        />
    );
}
