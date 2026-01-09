import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { X, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  Users,
  QrCode,
  Scan,
  Calendar,
  FileText,
  BarChart3,
  ClipboardList,
  Monitor,
  Video,
  Smartphone,
  Shield,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  Megaphone,
  Newspaper,
  LucideIcon,
  FolderOpen,
  Briefcase,
  HardHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import companyLogo from "@assets/gecl-logo.jpeg";
import { useAuth } from "@/lib/auth-context";
import { Permission } from "@shared/rbac";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// Reuse existing document check for backward compatibility if needed, 
// but strictly following new structure.

export const navigationGroups: NavGroup[] = [
  {
    title: "Utama",
    items: [
      { name: "Berita", href: "/workspace/news-feed", icon: Newspaper },
      { name: "Dashboard", href: "/workspace/dashboard", icon: BarChart3, requiredPermissions: [Permission.VIEW_DASHBOARD] },
    ]
  },
  {
    title: "Divisi",
    items: [
      {
        name: "HR",
        href: "#", // Dropdown container
        icon: Users,
        children: [
          { name: "Data Karyawan", href: "/workspace/employees", icon: Users, requiredPermissions: [Permission.VIEW_EMPLOYEES] },
          { name: "Roster", href: "/workspace/roster", icon: Calendar, requiredPermissions: [Permission.VIEW_ROSTER] },
          { name: "Management Cuti", href: "/workspace/leave-roster-monitoring", icon: Monitor, requiredPermissions: [Permission.VIEW_LEAVE, Permission.MANAGE_LEAVE] },
          { name: "Generate QR", href: "/workspace/qr-generator", icon: QrCode, requiredPermissions: [Permission.VIEW_QR, Permission.GENERATE_QR] },
          { name: "Scan QR", href: "/workspace/scanner", icon: Scan, requiredPermissions: [Permission.SCAN_QR] },
          { name: "Meeting", href: "/workspace/meetings", icon: Video, requiredPermissions: [Permission.VIEW_MEETING] },
          { name: "Scan Meeting", href: "/workspace/meeting-scanner", icon: Smartphone, requiredPermissions: [Permission.VIEW_MEETING, Permission.SCAN_QR] },
          { name: "Cuti", href: "/workspace/leave", icon: ClipboardList, requiredPermissions: [Permission.VIEW_LEAVE] },
          { name: "SIMPER", href: "/workspace/simper-monitoring", icon: Shield, requiredPermissions: [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES] },
          { name: "Laporan", href: "/workspace/reports", icon: FileText, requiredPermissions: [Permission.VIEW_REPORTS] },
        ]
      },
      {
        name: "HSE",
        href: "#", // Dropdown container
        icon: HardHat,
        children: [
          { name: "Sidak", href: "/workspace/sidak", icon: ClipboardCheck, requiredPermissions: [Permission.VIEW_SIDAK] },
          { name: "Dashboard Overspeed", href: "/workspace/hse/overspeed", icon: AlertTriangle, requiredPermissions: [Permission.VIEW_SIDAK] },
          { name: "Dashboard Jarak Aman", href: "/workspace/hse/jarak", icon: TrendingUp, requiredPermissions: [Permission.VIEW_SIDAK] },
          { name: "Monitoring Validasi Fatigue", href: "/workspace/hse/fatigue-validation", icon: Monitor, requiredPermissions: [Permission.VIEW_SIDAK] },
          { name: "Evaluasi Driver", href: "/workspace/evaluasi-driver", icon: TrendingUp, requiredPermissions: [Permission.VIEW_EVALUASI] },
          { name: "Dokumen", href: "/workspace/documents", icon: FolderOpen, requiredPermissions: [Permission.VIEW_DOCUMENTS] },
          { name: "Rekap Sidak", href: "/workspace/sidak/rekap", icon: ClipboardCheck, requiredPermissions: [Permission.VIEW_SIDAK] },
          { name: "Safety Patrol", href: "/workspace/safety-patrol", icon: Shield, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
          { name: "Pengumuman", href: "/workspace/announcements", icon: Megaphone, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
          { name: "Kelola Berita", href: "/workspace/news", icon: Newspaper, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
          { name: "Statistik Keselamatan", href: "/workspace/hse/statistics", icon: BarChart3, requiredPermissions: [Permission.VIEW_DASHBOARD] },
          // TNA Feature
          { name: "TNA Input", href: "/workspace/hse/tna/input", icon: ClipboardCheck, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
          { name: "TNA Dashboard", href: "/workspace/hse/tna/dashboard", icon: BarChart3, requiredPermissions: [Permission.VIEW_DASHBOARD] },
          { name: "Master Training", href: "/workspace/hse/tna/trainings", icon: FolderOpen, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
        ]
      }
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { hasAnyPermission } = useAuth();

  // Calculate initial expanded state based on current location
  const initialExpanded = useMemo(() => {
    const expanded: string[] = [];
    navigationGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => location.startsWith(child.href));
          if (hasActiveChild) {
            expanded.push(item.name);
          }
        }
      });
    });
    return expanded;
  }, [location]); // Keep active expansion in sync or just initial? User said "Default: collapse... except active".

  // We should likely update expanded menus when location changes if it enters a new group
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Sync expansion with location
  useEffect(() => {
    navigationGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.children) {
          // If any child matches current location, ensure parent is expanded
          const hasActiveChild = item.children.some(child => location === child.href || location.startsWith(child.href + '/'));
          if (hasActiveChild && !expandedMenus.includes(item.name)) {
            setExpandedMenus(prev => [...prev, item.name]);
          }
        }
      });
    });
  }, [location]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    );
  };

  const hasPermission = (item: NavItem) => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }
    if (item.requireAll) {
      return item.requiredPermissions.every(p => hasAnyPermission([p]));
    }
    return hasAnyPermission(item.requiredPermissions);
  };

  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(hasPermission)
  })).filter(group => group.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[100] hidden bg-black/80 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={cn(
        "bg-white dark:bg-gray-900 overflow-hidden hidden lg:flex flex-col transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)",
        "lg:fixed lg:inset-y-0 lg:left-0 lg:z-auto lg:w-64 lg:h-full lg:shadow-none lg:rounded-none lg:transform-none lg:opacity-100 lg:pointer-events-auto lg:translate-y-0 lg:scale-100",
        "fixed z-[110] shadow-2xl",
        "inset-4 md:inset-x-[20%] md:inset-y-[10%] rounded-3xl",
        isOpen
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto delay-75"
          : "opacity-0 scale-95 translate-y-8 pointer-events-none"
      )}>
        {/* Logo Header */}
        <div className="flex items-center h-16 px-4 bg-gradient-to-br from-red-600 to-red-700 dark:from-red-700 dark:to-red-800">
          <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-md flex-shrink-0">
            <img
              src={companyLogo}
              alt="GECL Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <span className="text-sm font-bold text-white block truncate">
              OneTalent
            </span>
            <span className="text-xs text-red-200 block truncate">
              PT. GECL
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-white hover:bg-white/20 flex-shrink-0"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {filteredGroups.map((group, groupIndex) => (
              <div key={group.title} className={cn(groupIndex > 0 && "mt-6")}>
                {group.title && (
                  <p className="px-4 mb-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest opacity-80">
                    {group.title}
                  </p>
                )}

                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    // Determine if top-level item is active (only if it has no children, otherwise it's just a folder)
                    const isActive = !hasChildren && (location === item.href || location.startsWith(item.href + '/'));
                    const isExpanded = expandedMenus.includes(item.name);
                    const IconComponent = item.icon;

                    if (hasChildren) {
                      return (
                        <div key={item.name}>
                          <button
                            onClick={() => toggleMenu(item.name)}
                            className={cn(
                              "flex items-center w-full px-4 py-3 rounded-2xl transition-all duration-300 group select-none",
                              "hover:bg-gray-50 dark:hover:bg-gray-800",
                              // Parent is active if expanded or if a child is active (optional visual cue)
                              isExpanded ? "text-gray-900 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"
                            )}
                          >
                            <IconComponent className={cn("w-5 h-5 flex-shrink-0 transition-colors duration-300",
                              isExpanded ? "text-red-500" : "text-gray-400 group-hover:text-gray-600"
                            )} />
                            <span className="ml-3 text-[15px] flex-1 text-left tracking-wide font-medium">{item.name}</span>
                            <ChevronDown className={cn(
                              "w-4 h-4 text-gray-400 transition-transform duration-300",
                              isExpanded ? "rotate-180 text-red-500" : ""
                            )} />
                          </button>

                          {isExpanded && (
                            <div className="mt-1 ml-4 pl-4 border-l-[1.5px] border-gray-100 dark:border-gray-800 space-y-1 py-1 animate-in slide-in-from-top-2 duration-200">
                              {item.children!.map((child) => {
                                // Check permissions for child items
                                if (!hasPermission(child)) return null;

                                const isChildActive = location === child.href || location.startsWith(child.href + '/');
                                const ChildIcon = child.icon;
                                return (
                                  <Link
                                    key={child.name}
                                    href={child.href}
                                    className={cn(
                                      "flex items-center px-4 py-2.5 rounded-xl transition-all duration-200",
                                      "hover:bg-gray-50 dark:hover:bg-gray-800",
                                      isChildActive
                                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
                                    )}
                                    onClick={() => {
                                      if (window.innerWidth < 1024) onClose();
                                    }}
                                  >
                                    <ChildIcon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isChildActive ? "text-red-500" : "text-gray-300 group-hover:text-gray-500")} />
                                    <span className="ml-3 text-[14px] tracking-wide">{child.name}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group mb-1 select-none",
                          "hover:bg-gray-50 dark:hover:bg-gray-800",
                          isActive
                            ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold shadow-sm"
                            : "text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-gray-200"
                        )}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                      >
                        <IconComponent className={cn("w-5 h-5 flex-shrink-0 transition-colors duration-300", isActive ? "text-red-600" : "text-gray-400 group-hover:text-gray-600")} />
                        <span className="ml-3 text-[15px] tracking-wide">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
