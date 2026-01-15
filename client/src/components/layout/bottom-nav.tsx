import { Link, useLocation } from "wouter";
import { Home, FileText, Bot, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const [location] = useLocation();

    const navItems = [
        { name: "Home", href: "/workspace", icon: Home },
        { name: "Sidak", href: "/workspace/sidak", icon: FileText },
        { name: "Mystic", href: "/workspace/si-asef", icon: Bot, isFloating: true },
        { name: "History", href: "/workspace/history", icon: Clock },
        { name: "Profile", href: "/workspace/employee-personal", icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe lg:hidden">
            <div className="flex items-center justify-between px-6 pt-2 pb-3 mb-1 relative">
                {navItems.map((item) => {
                    const isActive = location === item.href;
                    const Icon = item.icon;

                    if (item.isFloating) {
                        return (
                            <div key={item.name} className="relative -top-6">
                                <Link href={item.href}>
                                    <div className={cn(
                                        "flex flex-col items-center justify-center w-16 h-16 rounded-full shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95",
                                        "bg-gradient-to-br from-red-500 to-red-700 text-white border-4 border-gray-50 dark:border-gray-900"
                                    )}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                </Link>
                                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-red-600 dark:text-red-500">
                                    {item.name}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <Link key={item.name} href={item.href}>
                            <div className={cn(
                                "flex flex-col items-center justify-center p-1 rounded-xl transition-all duration-200 w-12",
                                isActive
                                    ? "text-red-600 dark:text-red-500"
                                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            )}>
                                <Icon className={cn(
                                    "w-6 h-6 mb-1 transition-all",
                                    isActive && "scale-110"
                                )} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={cn(
                                    "text-[10px] font-medium tracking-tight",
                                    isActive ? "opacity-100" : "opacity-80"
                                )}>
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
