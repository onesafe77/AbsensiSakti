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

            {/* Immersive 3D Background */}
            <div className="absolute inset-0 z-0 opacity-100">
                <Suspense fallback={<div className="w-full h-full bg-[#E5E7EB]" />}>
                    <Spline
                        scene="https://prod.spline.design/Ygri76RXZXhmZSnF/scene.splinecode"
                        onLoad={(spline) => {
                            // Helper to log all object names to finding the branding
                            console.log("🎨 SPLINE OBJECTS LOADED:");
                            function logObjects(obj: any, depth = 0) {
                                if (!obj) return;
                                console.log(`${"  ".repeat(depth)}• Name: "${obj.name}", Type: ${obj.type}, Visible: ${obj.visible}`);
                                if (obj.children) {
                                    obj.children.forEach((child: any) => logObjects(child, depth + 1));
                                }
                            }
                            // Traverse everything
                            // @ts-ignore
                            if (spline._scene) logObjects(spline._scene);

                            // Try to hide common potential names based on observation
                            const candidates = ['OneTalent', 'Text', 'Created By', 'Branding', 'Box', 'Rectangle', 'Group', 'Shape'];
                            candidates.forEach(name => {
                                const obj = spline.findObjectByName(name);
                                if (obj) {
                                    console.log(`❌ Hiding object: ${name}`);
                                    obj.visible = false;
                                }
                            });

                            spline.setZoom(1.2); // Zoom in slightly to cut off edges
                        }}
                    />
                </Suspense>
            </div>

            {/* Subtle Gradient Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-slate-200/30 z-[1] pointer-events-none"></div>

            {/* Main Content Area */}
            <main className="relative z-10 w-full max-w-[1000px] flex flex-col items-center justify-center px-6">

                {/* Interaction Section - Centered for a clean look */}
                <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-[700px] text-center">
                        Experience liftoff with the next-generation portal for safety and productivity management.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6">
                        <Link href="/login">
                            <Button size="lg" className="rounded-full px-12 h-16 text-lg font-bold bg-slate-900 text-white hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto min-w-[200px]">
                                Masuk
                                <ArrowRight className="ml-3 w-6 h-6" />
                            </Button>
                        </Link>

                        <Button variant="outline" size="lg" className="rounded-full px-12 h-16 text-lg font-semibold border-slate-300 bg-white/40 backdrop-blur-md hover:bg-white text-slate-700 transition-all w-full sm:w-auto min-w-[200px] hover:-translate-y-1 shadow-md">
                            Explore use cases
                        </Button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="absolute bottom-8 w-full text-center text-slate-400 text-sm z-10 font-medium">
                &copy; {new Date().getFullYear()} PT. Goden Energi Cemerlang Lestari. All rights reserved.
            </footer>
        </div>
    );
}
