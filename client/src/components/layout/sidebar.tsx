import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { X, ChevronDown, ChevronRight } from "lucide-react";
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
  Settings,
  Activity,
  Clock,
  User,
  Bot,
  MessageSquare,
  Database,
  Bell,
  Car
} from "lucide-react";
import { Button } from "@/components/ui/button";
import oneTalentLogo from "@assets/onetalent-logo.png";
import { useAuth } from "@/lib/auth-context";
import { Permission } from "@shared/rbac";

export interface NavItem {
  name: string;
  href?: string;
  icon?: LucideIcon;
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
      {
        name: "Mystic AI",
        icon: Bot,
        children: [
          { name: "Chat Regulasi", href: "/workspace/si-asef", icon: MessageSquare },
          { name: "Activity Calendar", href: "/workspace/activity-calendar", icon: Calendar },
          { name: "Knowledge Base", href: "/workspace/si-asef/admin", icon: Database, requiredPermissions: [Permission.MANAGE_EMPLOYEES] }
        ]
      },
    ]
  },
  {
    title: "Divisi",
    items: [
      {
        name: "HR",
        icon: Users,
        children: [
          { name: "Dashboard Karyawan", href: "/workspace/employees/dashboard", icon: BarChart3, requiredPermissions: [Permission.VIEW_EMPLOYEES] },
          { name: "List Karyawan", href: "/workspace/employees/list", icon: Users, requiredPermissions: [Permission.VIEW_EMPLOYEES] },
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
        icon: HardHat,
        children: [
          {
            name: "K3",
            icon: Shield,
            children: [
              {
                name: "Data Keselamatan",
                icon: BarChart3,
                children: [
                  { name: "Statistik Keselamatan", href: "/workspace/hse/statistics", icon: BarChart3, requiredPermissions: [Permission.VIEW_DASHBOARD] },
                  { name: "Dashboard Overspeed", href: "/workspace/hse/overspeed", icon: AlertTriangle, requiredPermissions: [Permission.VIEW_SIDAK] },
                  { name: "Dashboard Jarak Aman", href: "/workspace/hse/jarak", icon: TrendingUp, requiredPermissions: [Permission.VIEW_SIDAK] },
                  { name: "Monitoring Validasi Fatigue", href: "/workspace/hse/fatigue-validation", icon: Monitor, requiredPermissions: [Permission.VIEW_SIDAK] },
                  { name: "FMS Violation", href: "/workspace/hse/fms-dashboard", icon: Car, requiredPermissions: [Permission.VIEW_SIDAK] },
                ]
              },
              {
                name: "Kegiatan",
                icon: Activity,
                children: [
                  { name: "Sidak", href: "/workspace/sidak", icon: ClipboardCheck, requiredPermissions: [Permission.VIEW_SIDAK] },
                  { name: "Rekap Sidak", href: "/workspace/sidak/rekap", icon: ClipboardCheck, requiredPermissions: [Permission.VIEW_SIDAK] },
                  { name: "Evaluasi Driver", href: "/workspace/evaluasi-driver", icon: TrendingUp, requiredPermissions: [Permission.VIEW_EVALUASI] },
                  { name: "Safety Patrol", href: "/workspace/safety-patrol", icon: Shield, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
                  // Kept items present in old menu but missed in strict list to avoid data loss, clustered in Kegiatan
                  { name: "Pengumuman", href: "/workspace/announcements", icon: Megaphone, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
                  { name: "Kelola Berita", href: "/workspace/news", icon: Newspaper, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
                ]
              },
              {
                name: "TNA",
                icon: ClipboardList,
                children: [
                  { name: "TNA Input", href: "/workspace/hse/tna/input", icon: ClipboardCheck, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
                  { name: "TNA Dashboard", href: "/workspace/hse/tna/dashboard", icon: BarChart3, requiredPermissions: [Permission.VIEW_DASHBOARD] },
                  { name: "Monitoring Kompetensi", href: "/workspace/hse/tna/monitoring", icon: Monitor, requiredPermissions: [Permission.VIEW_DASHBOARD] },
                  { name: "Rekap TNA", href: "/workspace/hse/tna/rekap", icon: FileText, requiredPermissions: [Permission.VIEW_DASHBOARD] },
                  { name: "Master Training", href: "/workspace/hse/tna/trainings", icon: FolderOpen, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
                ]
              },
              {
                name: "Dokumen",
                icon: FolderOpen,
                children: [
                  { name: "Masterlist", href: "/workspace/hse/k3/document-control", icon: FileText, requiredPermissions: [Permission.VIEW_DOCUMENTS] },
                  { name: "Document Control", href: "/workspace/hse/k3/document-control?tab=control", icon: Shield, requiredPermissions: [Permission.VIEW_DOCUMENTS] },
                  { name: "Approval Inbox", href: "/workspace/hse/k3/document-control?tab=inbox", icon: Clock, requiredPermissions: [Permission.VIEW_DOCUMENTS] },
                  { name: "Dokumen Saya", href: "/workspace/hse/k3/document-control?tab=distribution", icon: User, requiredPermissions: [Permission.VIEW_DOCUMENTS] },
                  { name: "External Register", href: "/workspace/hse/k3/document-control?tab=external", icon: FolderOpen, requiredPermissions: [Permission.VIEW_DOCUMENTS] },
                  { name: "Record Control", href: "/workspace/hse/k3/document-control?tab=records", icon: ClipboardList, requiredPermissions: [Permission.VIEW_DOCUMENTS] },
                ]
              },
            ]
          },
          {
            name: "KO",
            icon: Settings,
            children: [
              { name: "Coming Soon", href: "#", icon: AlertTriangle },
            ]
          }
        ]
      }
    ]
  },
  {
    title: "Other",
    items: [
      {
        name: "Push Notifikasi",
        icon: Bell,
        children: [
          { name: "SIMPER", href: "/workspace/push-notification/simper", icon: Car, requiredPermissions: [Permission.MANAGE_EMPLOYEES] },
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
  const [search, setSearch] = useState(window.location.search);
  const { hasAnyPermission } = useAuth();

  // Sync search state on navigation
  useEffect(() => {
    const handlePopState = () => setSearch(window.location.search);
    window.addEventListener("popstate", handlePopState);

    // Monkey-patch pushState to catch wouter's navigation
    const originalPushState = history.pushState;
    history.pushState = function () {
      originalPushState.apply(this, arguments as any);
      setSearch(window.location.search);
    };

    return () => {
      window.removeEventListener("popstate", handlePopState);
      history.pushState = originalPushState;
    };
  }, []);

  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Sync expansion with location and initial load
  useEffect(() => {
    const newExpanded: string[] = [];

    const findActiveItems = (items: NavItem[]) => {
      items.forEach(item => {
        if (item.children) {
          const isActive = item.children.some(child =>
            child.href && (location === child.href || location.startsWith(child.href + '/'))
            || (child.children && findRecursive(child))
          );

          if (isActive && !expandedMenus.includes(item.name)) {
            setExpandedMenus(prev => prev.includes(item.name) ? prev : [...prev, item.name]);
          }
          findActiveItems(item.children);
        }
      });
    }

    const findRecursive = (item: NavItem): boolean => {
      if (item.href && (location === item.href || location.startsWith(item.href + '/'))) return true;
      if (item.children) return item.children.some(c => findRecursive(c));
      return false;
    }

    navigationGroups.forEach(group => findActiveItems(group.items));
  }, [location]);

  const toggleMenu = (menuName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling
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

  // Recursive Sidebar Item Component
  const SidebarItemRenderer = ({ item, depth = 0 }: { item: NavItem, depth?: number }) => {
    if (!hasPermission(item)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.name);
    // Active if matches href exactly (including query) or is a parent of active child
    const currentFullHref = location + search;
    const isActiveLink = item.href && (() => {
      // 1. Exact match of full URL (path + search)
      if (currentFullHref === item.href) return true;

      // 2. If item.href has query params, STRICTLY check if they differ
      if (item.href.includes('?')) {
        return currentFullHref === item.href;
      }

      // 3. If item.href has NO query params (e.g. Masterlist), 
      // ONLY match if the current location has NO query params (or strict base match)
      // This prevents "Masterlist" from being active when "Document Control" (?tab=control) is active
      if (!item.href.includes('?') && location === item.href) {
        // If current location has search params, this 'base' item should NOT be active 
        // unless it's a parent, but here we are leaf nodes.
        // UNLESS the item logic specifically allows it. 
        // For Masterlist logic: /workspace/.../document-control should NOT match /workspace/.../document-control?tab=control
        if (search && search !== '?tab=masterlist') return false;
        return true;
      }

      return false;
    })();
    const IconComponent = item.icon;

    // Permissions check for children (hide parent if no visible children)
    if (hasChildren) {
      const visibleChildren = item.children!.filter(hasPermission);
      if (visibleChildren.length === 0) return null;
    }

    if (hasChildren) {
      return (
        <div className="select-none">
          <button
            onClick={(e) => toggleMenu(item.name, e)}
            className={cn(
              "flex items-center w-full rounded-xl transition-all duration-200 group text-left",
              depth === 0 ? "px-4 py-3 mb-1" : "px-4 py-2 mb-0.5",
              "hover:bg-gray-50 dark:hover:bg-gray-800",
              isExpanded ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"
            )}
            style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}
          >
            {IconComponent && (
              <IconComponent className={cn(
                "flex-shrink-0 transition-colors duration-300",
                depth === 0 ? "w-5 h-5" : "w-4 h-4",
                isExpanded ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"
              )} />
            )}
            <span className={cn(
              "ml-3 flex-1 tracking-wide whitespace-normal leading-tight",
              depth === 0 ? "text-[15px] font-medium" : "text-[13px] font-normal"
            )}>
              {item.name}
            </span>
            <ChevronDown className={cn(
              "flex-shrink-0 transition-transform duration-300 ml-2",
              depth === 0 ? "w-4 h-4" : "w-3 h-3",
              isExpanded ? "rotate-180 text-red-500" : "text-gray-400"
            )} />
          </button>

          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="space-y-0.5">
              {item.children!.map((child) => (
                <SidebarItemRenderer key={child.name} item={child} depth={depth + 1} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link href={item.href || "#"}
        onClick={() => {
          if (window.innerWidth < 1024) onClose();
        }}
      >
        <div className={cn(
          "flex items-center w-full rounded-xl transition-all duration-200 group relative",
          depth === 0 ? "px-4 py-3 mb-1" : "px-4 py-2.5 mb-0.5",
          "hover:bg-gray-50 dark:hover:bg-gray-800",
          isActiveLink
            ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        )}
          style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}
        >
          {isActiveLink && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-500 rounded-r-full" />
          )}

          {IconComponent && (
            <IconComponent className={cn(
              "flex-shrink-0 transition-colors",
              depth === 0 ? "w-5 h-5" : "w-4 h-4",
              isActiveLink ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"
            )} />
          )}
          <span className={cn(
            "ml-3 tracking-wide whitespace-normal leading-tight",
            depth === 0 ? "text-[15px] font-medium" : "text-[13px]"
          )}>
            {item.name}
          </span>
        </div>
      </Link>
    );
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
        "bg-white dark:bg-gray-900 overflow-hidden flex flex-col transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)",
        // Desktop styles (fixed, full height) - ONLY VISIBLE ON DESKTOP
        "hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-auto lg:h-full lg:shadow-none lg:rounded-none lg:opacity-100 lg:pointer-events-auto",

        // Desktop width & transform control based on isOpen
        isOpen ? "lg:w-64 lg:translate-x-0" : "lg:w-0 lg:-translate-x-full"
      )}>
        {/* Logo Header */}
        <div className="flex items-center h-16 px-6 bg-transparent">
          <div className="w-28">
            <img
              src={oneTalentLogo}
              alt="OneTalent Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 ml-auto text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
            {filteredGroups.map((group, groupIndex) => (
              <div key={group.title} className={cn(groupIndex > 0 && "mt-6")}>
                {group.title && (
                  <p className="px-4 mb-2 text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest opacity-90">
                    {group.title}
                  </p>
                )}

                <div className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarItemRenderer key={item.name} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
