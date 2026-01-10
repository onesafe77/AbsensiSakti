import React, { useEffect, useRef } from 'react';

interface AnimatedDotsBackgroundProps {
    dotCount?: number;
    dotSize?: number;
    speed?: number;
    interactionRadius?: number;
    interactionStrength?: number;
    dotColor?: string; // Hex or rgba (Single color fallback)
    dotColors?: string[]; // Array of colors for multicolor support
}

export function AnimatedDotsBackground({
    dotCount = 150,
    dotSize = 2,
    speed = 0.5,
    interactionRadius = 150,
    interactionStrength = 0.05,
    dotColor = 'rgba(100, 149, 237, 0.3)', // Default Blue
    dotColors
}: AnimatedDotsBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const dotsRef = useRef<any[]>([]);
    const animationFrameRef = useRef<number>();

    // Prepare color palette: use dotColors if provided, else fallback to single dotColor
    // We capture this in a ref or variable to access inside Dot class, but useEffect dependency is easier.
    // However, since Dot class is defined inside useEffect, we can access 'palette' directly if defined there.

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Check prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const palette = dotColors && dotColors.length > 0 ? dotColors : [dotColor];

        // Responsive dot count
        const getResponsiveDotCount = () => {
            const width = window.innerWidth;
            if (width < 768) return Math.min(dotCount, 80); // Mobile
            return dotCount;
        };

        let activeDotCount = getResponsiveDotCount();

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            activeDotCount = getResponsiveDotCount();
            initDots();
        };

        class Dot {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            originalX: number;
            originalY: number;
            color: string;

            constructor() {
                this.x = Math.random() * (canvas?.width || window.innerWidth);
                this.y = Math.random() * (canvas?.height || window.innerHeight);
                this.vx = (Math.random() - 0.5) * speed;
                this.vy = (Math.random() - 0.5) * speed;
                this.size = Math.random() * dotSize + 1;
                this.originalX = this.x;
                this.originalY = this.y;
                this.color = palette[Math.floor(Math.random() * palette.length)];
            }

            update(mouse: { x: number, y: number }) {
                if (!canvas) return;

                // Basic drift
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

                // Mouse interaction
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < interactionRadius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (interactionRadius - distance) / interactionRadius;

                    // Repel effect
                    const dirx = forceDirectionX * force * interactionStrength * 50;
                    const diry = forceDirectionY * force * interactionStrength * 50;

                    this.x -= dirx;
                    this.y -= diry;
                }
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        const initDots = () => {
            dotsRef.current = [];
            for (let i = 0; i < activeDotCount; i++) {
                dotsRef.current.push(new Dot());
            }
        };

        const animate = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            dotsRef.current.forEach(dot => {
                dot.update(mouseRef.current);
                dot.draw();
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            } else {
                animate();
            }
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [dotCount, dotSize, speed, interactionRadius, interactionStrength, dotColor, dotColors]); // Added dotColors dependency

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'transparent' }} // Ensure transparent background
        >
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
}
