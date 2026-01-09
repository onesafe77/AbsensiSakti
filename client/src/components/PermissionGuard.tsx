import { useAuth } from "@/lib/auth-context";
import { Permission } from "@shared/rbac";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions: Permission[];
  requireAll?: boolean;
}

export function PermissionGuard({ 
  children, 
  requiredPermissions,
  requireAll = false
}: PermissionGuardProps) {
  const { hasAnyPermission, hasAllPermissions } = useAuth();

  const hasAccess = requireAll 
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);
  
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
          <ShieldX className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Akses Ditolak
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <Link href="/workspace">
          <Button variant="outline" data-testid="btn-back-dashboard">
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
