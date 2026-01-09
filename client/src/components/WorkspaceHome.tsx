import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Permission } from "@shared/rbac";
import { Loader2 } from "lucide-react";

export function WorkspaceHome() {
  const { hasAnyPermission } = useAuth();
  const [, setLocation] = useLocation();
  
  const canViewDashboard = hasAnyPermission([Permission.VIEW_DASHBOARD]);
  
  useEffect(() => {
    if (canViewDashboard) {
      setLocation("/workspace/dashboard");
    } else {
      setLocation("/workspace/news-feed");
    }
  }, [canViewDashboard, setLocation]);
  
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}
