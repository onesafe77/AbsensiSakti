import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Spline from '@splinetool/react-spline';
import { Suspense } from "react";

export default function LandingPage() {
    // Rebranding Version: 3.0 (OneTalent Original Design - Light & Crisp)
    // 1. Light Theme Aesthetic (#eff1f3)
    // 2. Centered Frosted Glass Branding
    // 3. Immersive Spline Integration
    return (
        <div className="relative min-h-screen w-full bg-[#E5E7EB] overflow-hidden text-slate-900 font-sans selection:bg-blue-500/20 flex items-center justify-center">
            {/* Hide Spline Logo Badge */}
            <style>{`
                a[href^="https://spline.design"] {
                    display: none !important;
                }
            `}</style>

            {/* Immersive 3D Background */}
            <div className="absolute inset-0 z-0 opacity-100">
                <Suspense fallback={<div className="w-full h-full bg-[#E5E7EB]" />}>
                    <Spline
                        scene="https://prod.spline.design/DM9x2ADdMUM5XlDE/scene.splinecode"
                    />
                </Suspense>
            </div>

            {/* Subtle Gradient Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-slate-200/30 z-[1] pointer-events-none"></div>

            {/* Main Content Area */}
            <main className="relative z-10 w-full max-w-[1000px] flex flex-col items-center justify-center px-6">

                {/* Interaction Section - Centered for a clean look */}
                {/* Glassmorphism Card Container */}
                <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 p-12 rounded-[40px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl relative overflow-hidden group hover:bg-white/15 transition-all">

                    {/* Glossy sheen effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="text-center space-y-2">
                        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600 drop-shadow-sm">
                            OneTalent
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 font-medium max-w-[600px] leading-relaxed">
                            Experience liftoff with the next-generation portal for safety and productivity management.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Link href="/login">
                            <Button size="lg" className="rounded-2xl px-8 h-14 text-base font-bold bg-slate-900/90 hover:bg-black text-white backdrop-blur-sm transition-all shadow-lg hover:shadow-slate-900/20 hover:-translate-y-0.5 w-full sm:w-auto min-w-[160px]">
                                Masuk
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>

                        <Button variant="outline" size="lg" className="rounded-2xl px-8 h-14 text-base font-semibold border-white/30 bg-white/20 hover:bg-white/40 text-slate-800 backdrop-blur-md transition-all w-full sm:w-auto min-w-[160px] shadow-sm">
                            Explore use cases
                        </Button>
                    </div>
                </div>

                <style>{`
                    /* Aggressively hide Spline badge */
                    a[href^="https://spline.design"],
                    a[href*="spline.design"],
                    div[style*="z-index"][style*="position: absolute"] > a {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                        pointer-events: none !important;
                    }
                `}</style>
            </main>

            {/* Footer */}
            <footer className="absolute bottom-8 w-full text-center text-slate-400 text-sm z-10 font-medium">
                &copy; {new Date().getFullYear()} PT. Goden Energi Cemerlang Lestari. All rights reserved.
            </footer>
        </div>
    );
}
