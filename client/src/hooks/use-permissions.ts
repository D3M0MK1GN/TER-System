import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";

export type UserRole = "admin" | "supervisor" | "usuario";

export interface Permission {
  canViewUsers: boolean;
  canManageUsers: boolean;
  canViewAllRequests: boolean;
  canManageAllRequests: boolean;
  canViewAllReports: boolean;
  canViewDashboard: boolean;
  canViewEmailTemplates: boolean;
}

export function usePermissions(): Permission {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user) {
      return {
        canViewUsers: false,
        canManageUsers: false,
        canViewAllRequests: false,
        canManageAllRequests: false,
        canViewAllReports: false,
        canViewDashboard: false,
        canViewEmailTemplates: false,
      };
    }

    const role = user.rol as UserRole;

    switch (role) {
      case "admin":
        return {
          canViewUsers: true,
          canManageUsers: true,
          canViewAllRequests: true,
          canManageAllRequests: true,
          canViewAllReports: true,
          canViewDashboard: true,
          canViewEmailTemplates: true,
        };
      
      case "supervisor":
        return {
          canViewUsers: false,
          canManageUsers: false,
          canViewAllRequests: true,
          canManageAllRequests: true,
          canViewAllReports: true,
          canViewDashboard: true,
          canViewEmailTemplates: false,
        };
      
      case "usuario":
        return {
          canViewUsers: false,
          canManageUsers: false,
          canViewAllRequests: false,
          canManageAllRequests: false,
          canViewAllReports: false,
          canViewDashboard: true,
          canViewEmailTemplates: false,
        };
      
      default:
        return {
          canViewUsers: false,
          canManageUsers: false,
          canViewAllRequests: false,
          canManageAllRequests: false,
          canViewAllReports: false,
          canViewDashboard: false,
          canViewEmailTemplates: false,
        };
    }
  }, [user?.rol]);
}

export function useHasPermission() {
  const permissions = usePermissions();
  
  return (permission: keyof Permission): boolean => {
    return permissions[permission];
  };
}