import { useAuth } from "@/hooks/use-auth";

export type UserRole = "admin" | "supervisor" | "usuario";

export interface Permission {
  canViewUsers: boolean;
  canManageUsers: boolean;
  canViewAllRequests: boolean;
  canManageAllRequests: boolean;
  canViewAllReports: boolean;
  canViewDashboard: boolean;
}

export function usePermissions(): Permission {
  const { user } = useAuth();
  
  if (!user) {
    return {
      canViewUsers: false,
      canManageUsers: false,
      canViewAllRequests: false,
      canManageAllRequests: false,
      canViewAllReports: false,
      canViewDashboard: false,
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
      };
    
    case "supervisor":
      return {
        canViewUsers: false,
        canManageUsers: false,
        canViewAllRequests: true,
        canManageAllRequests: true,
        canViewAllReports: true,
        canViewDashboard: true,
      };
    
    case "usuario":
      return {
        canViewUsers: false,
        canManageUsers: false,
        canViewAllRequests: false,
        canManageAllRequests: false,
        canViewAllReports: false,
        canViewDashboard: true,
      };
    
    default:
      return {
        canViewUsers: false,
        canManageUsers: false,
        canViewAllRequests: false,
        canManageAllRequests: false,
        canViewAllReports: false,
        canViewDashboard: false,
      };
  }
}

export function useHasPermission() {
  const permissions = usePermissions();
  
  return (permission: keyof Permission): boolean => {
    return permissions[permission];
  };
}