// Permission types and schemas

export type PermissionAction = 'read' | 'write' | 'delete' | 'admin';

export interface PagePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  admin: boolean;
}

export interface RolePermissions {
  [page: string]: PagePermissions;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermissions;
  is_system_role: boolean;
  is_assignable: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionsSchema {
  [category: string]: {
    [page: string]: string; // page key -> display name
  };
}

export const PERMISSION_CATEGORIES = [
  'Core Pages',
  'Team Management',
  'Business Operations',
  'Analytics',
  'Administration',
] as const;

export type PermissionCategory = typeof PERMISSION_CATEGORIES[number];

// Helper function to check if user has permission
export const hasPermission = (
  permissions: RolePermissions,
  page: string,
  action: PermissionAction
): boolean => {
  const pagePerms = permissions[page];
  if (!pagePerms) return false;
  
  // Admin permission grants all other permissions
  if (pagePerms.admin) return true;
  
  return pagePerms[action] === true;
};

// Helper function to check if user can access page (read or higher)
export const canAccessPage = (
  permissions: RolePermissions,
  page: string
): boolean => {
  return hasPermission(permissions, page, 'read');
};

// Helper function to get all pages from permissions
export const getAllPages = (schema: PermissionsSchema): string[] => {
  const pages: string[] = [];
  Object.values(schema).forEach(category => {
    Object.keys(category).forEach(page => {
      if (!pages.includes(page)) {
        pages.push(page);
      }
    });
  });
  return pages;
};

