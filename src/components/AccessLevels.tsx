import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Shield, ChevronDown, ChevronRight, Settings2 } from 'lucide-react';
import { Role, PermissionsSchema, PermissionAction, PERMISSION_CATEGORIES } from '@/types/permissions';
import { CreateEditRoleDialog } from './CreateEditRoleDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AccessLevelsProps {
  currentUserRole: string | null;
}

export const AccessLevels = ({ currentUserRole }: AccessLevelsProps) => {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);
  const queryClient = useQueryClient();

  const isSuperAdmin = currentUserRole === 'Super Admin';

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_roles', { include_non_assignable: true });
      if (error) throw error;
      return (data || []) as Role[];
    },
  });

  // Fetch permissions schema
  const { data: permissionsSchema, isLoading: schemaLoading } = useQuery({
    queryKey: ['permissions-schema'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_permissions_schema');
      if (error) throw error;
      return data as PermissionsSchema;
    },
  });

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: string; permissions: Role['permissions'] }) => {
      const role = roles.find(r => r.id === roleId);
      if (!role) throw new Error('Role not found');

      const { error } = await supabase.rpc('update_role', {
        role_id: roleId,
        role_name: role.name,
        role_description: role.description,
        role_permissions: permissions,
        role_is_assignable: role.is_assignable,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
      toast.success('Permissions updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update permissions: ${error.message}`);
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.rpc('delete_role', { role_id: roleId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
      toast.success('Role deleted successfully');
      setRoleToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete role: ${error.message}`);
    },
  });

  const handlePermissionToggle = (
    roleId: string,
    page: string,
    action: PermissionAction
  ) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admins can modify permissions');
      return;
    }

    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const newPermissions = { ...role.permissions };
    if (!newPermissions[page]) {
      newPermissions[page] = { read: false, write: false, delete: false, admin: false };
    }

    newPermissions[page][action] = !newPermissions[page][action];

    if (action === 'admin' && newPermissions[page][action]) {
      newPermissions[page] = { read: true, write: true, delete: true, admin: true };
    }

    updatePermissionsMutation.mutate({ roleId, permissions: newPermissions });
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  };

  const handleEditSuccess = () => {
    setEditingRole(null);
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  };

  const getPermissionCount = (role: Role) => {
    const perms = role.permissions;
    let total = 0;
    let enabled = 0;
    Object.values(perms).forEach(pagePerms => {
      Object.values(pagePerms).forEach(val => {
        total++;
        if (val) enabled++;
      });
    });
    return { enabled, total };
  };

  const openPermissionsDialog = (role: Role) => {
    setSelectedRoleForPermissions(role);
    setPermissionsDialogOpen(true);
  };

  if (rolesLoading || schemaLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Filter and sort roles - Super Admin always at top
  const displayRoles = roles
    .filter(role => {
      if (role.name === 'Super Admin' && !isSuperAdmin) return false;
      return role.is_assignable || isSuperAdmin;
    })
    .sort((a, b) => {
      // Super Admin always first
      if (a.name === 'Super Admin') return -1;
      if (b.name === 'Super Admin') return 1;
      // Then system roles, then custom roles
      if (a.is_system_role && !b.is_system_role) return -1;
      if (!a.is_system_role && b.is_system_role) return 1;
      // Alphabetical within groups
      return a.name.localeCompare(b.name);
    });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-gray-700" />
              Access Levels
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage role permissions and access levels for your team
            </p>
          </div>
          {isSuperAdmin && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Role
            </Button>
          )}
        </div>

        {/* Roles Table */}
        {displayRoles.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No roles found</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Create your first role to get started with access management
              </p>
              {isSuperAdmin && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Roles & Permissions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="w-[300px] font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="text-center font-semibold">Permissions</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                      {isSuperAdmin && (
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayRoles.map((role) => {
                      const { enabled, total } = getPermissionCount(role);
                      const permissionPercentage = total > 0 ? Math.round((enabled / total) * 100) : 0;

                      return (
                        <TableRow 
                          key={role.id} 
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-4 w-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: role.color || '#6366f1' }}
                              />
                              <span>{role.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {role.description || 'No description'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                                    style={{ width: `${permissionPercentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-700 min-w-[45px]">
                                  {permissionPercentage}%
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {enabled}/{total}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Badge 
                                variant={role.is_assignable ? "default" : "outline"}
                                className={role.is_assignable ? "bg-green-100 text-green-700 border-green-200" : ""}
                              >
                                {role.is_assignable ? 'Assignable' : 'System'}
                              </Badge>
                            </div>
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openPermissionsDialog(role)}
                                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                >
                                  <Settings2 className="h-4 w-4 mr-1" />
                                  Permissions
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingRole(role)}
                                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRoleToDelete(role)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRoleForPermissions?.name} - Permissions
            </DialogTitle>
            <DialogDescription>
              Configure permissions for this role. Toggle individual access levels below.
            </DialogDescription>
          </DialogHeader>
          {selectedRoleForPermissions && permissionsSchema && (
            <div className="space-y-6 py-4">
              {PERMISSION_CATEGORIES.map((category) => {
                const categoryPages = permissionsSchema[category];
                if (!categoryPages || Object.keys(categoryPages).length === 0) {
                  return null;
                }

                return (
                  <div key={category} className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(categoryPages).map(([page, displayName]) => {
                        const pagePerms = selectedRoleForPermissions.permissions[page] || {
                          read: false,
                          write: false,
                          delete: false,
                          admin: false,
                        };

                        const hasAnyPermission = Object.values(pagePerms).some(v => v);
                        const hasAdmin = pagePerms.admin;

                        return (
                          <div
                            key={page}
                            className={`border rounded-lg p-4 transition-all ${
                              hasAnyPermission 
                                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-medium text-sm text-gray-900">
                                {displayName}
                              </div>
                              {hasAdmin && (
                                <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <Label 
                                  htmlFor={`${selectedRoleForPermissions.id}-${page}-read`} 
                                  className="text-xs font-medium text-gray-700"
                                >
                                  Read
                                </Label>
                                <Switch
                                  id={`${selectedRoleForPermissions.id}-${page}-read`}
                                  checked={pagePerms.read}
                                  disabled={!isSuperAdmin}
                                  onCheckedChange={() =>
                                    handlePermissionToggle(selectedRoleForPermissions.id, page, 'read')
                                  }
                                  className="data-[state=checked]:bg-blue-600"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label 
                                  htmlFor={`${selectedRoleForPermissions.id}-${page}-write`} 
                                  className="text-xs font-medium text-gray-700"
                                >
                                  Write
                                </Label>
                                <Switch
                                  id={`${selectedRoleForPermissions.id}-${page}-write`}
                                  checked={pagePerms.write}
                                  disabled={!isSuperAdmin}
                                  onCheckedChange={() =>
                                    handlePermissionToggle(selectedRoleForPermissions.id, page, 'write')
                                  }
                                  className="data-[state=checked]:bg-blue-600"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label 
                                  htmlFor={`${selectedRoleForPermissions.id}-${page}-delete`} 
                                  className="text-xs font-medium text-gray-700"
                                >
                                  Delete
                                </Label>
                                <Switch
                                  id={`${selectedRoleForPermissions.id}-${page}-delete`}
                                  checked={pagePerms.delete}
                                  disabled={!isSuperAdmin}
                                  onCheckedChange={() =>
                                    handlePermissionToggle(selectedRoleForPermissions.id, page, 'delete')
                                  }
                                  className="data-[state=checked]:bg-blue-600"
                                />
                              </div>
                              <div className="flex items-center justify-between border-t pt-2">
                                <Label 
                                  htmlFor={`${selectedRoleForPermissions.id}-${page}-admin`} 
                                  className="text-xs font-semibold text-gray-900"
                                >
                                  Admin
                                </Label>
                                <Switch
                                  id={`${selectedRoleForPermissions.id}-${page}-admin`}
                                  checked={pagePerms.admin}
                                  disabled={!isSuperAdmin}
                                  onCheckedChange={() =>
                                    handlePermissionToggle(selectedRoleForPermissions.id, page, 'admin')
                                  }
                                  className="data-[state=checked]:bg-blue-600"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Role Dialog */}
      <CreateEditRoleDialog
        isOpen={isCreateDialogOpen || editingRole !== null}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingRole(null);
        }}
        role={editingRole}
        onSuccess={editingRole ? handleEditSuccess : handleCreateSuccess}
        permissionsSchema={permissionsSchema}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={roleToDelete !== null} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
              You cannot delete roles that are assigned to active team members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roleToDelete && deleteRoleMutation.mutate(roleToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
