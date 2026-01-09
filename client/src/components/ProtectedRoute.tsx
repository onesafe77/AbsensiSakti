import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Permission } from "@shared/rbac";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions,
  requireAll = false,
  fallbackPath = "/workspace"
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  if (isLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasAccess) {
      return <Redirect to={fallbackPath} />;
    }
  }

  return <>{children}</>;
}
