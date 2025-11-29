import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Lock, Trash2, Edit2 } from 'lucide-react';
import { Role, PermissionsSchema, PermissionAction, PERMISSION_CATEGORIES, hasPermission } from '@/types/permissions';
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
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface AccessLevelsProps {
  currentUserRole: string | null;
}

export const AccessLevels = ({ currentUserRole }: AccessLevelsProps) => {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

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

    // Toggle the specific permission
    newPermissions[page][action] = !newPermissions[page][action];

    // If admin is enabled, enable all other permissions
    if (action === 'admin' && newPermissions[page][action]) {
      newPermissions[page] = { read: true, write: true, delete: true, admin: true };
    }
    // If admin is disabled, keep other permissions as they are
    else if (action === 'admin' && !newPermissions[page][action]) {
      // Don't auto-disable others when admin is toggled off
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

  if (rolesLoading || schemaLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter roles to show only assignable ones (excluding Super Admin from display if not super admin)
  const displayRoles = roles.filter(role => {
    if (role.name === 'Super Admin' && !isSuperAdmin) return false;
    return role.is_assignable || isSuperAdmin;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Access Levels
                {!isSuperAdmin && (
                  <Badge variant="outline" className="ml-2">
                    Read Only
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage role permissions and access levels for team members
              </CardDescription>
            </div>
            {isSuperAdmin && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Role
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayRoles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No roles found. Create your first role to get started.
            </div>
          ) : (
            <div className="space-y-6">
              {displayRoles.map((role) => (
                <div
                  key={role.id}
                  className="border rounded-lg p-6 space-y-4 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{role.name}</h3>
                        {role.is_system_role && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            System
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      )}
                    </div>
                    {isSuperAdmin && !role.is_system_role && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRole(role)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRoleToDelete(role)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {permissionsSchema && (
                    <div className="space-y-4 pt-4 border-t">
                      {PERMISSION_CATEGORIES.map((category) => {
                        const categoryPages = permissionsSchema[category];
                        if (!categoryPages || Object.keys(categoryPages).length === 0) {
                          return null;
                        }

                        return (
                          <div key={category} className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              {category}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(categoryPages).map(([page, displayName]) => {
                                const pagePerms = role.permissions[page] || {
                                  read: false,
                                  write: false,
                                  delete: false,
                                  admin: false,
                                };

                                return (
                                  <div
                                    key={page}
                                    className="border rounded-md p-3 space-y-2 bg-gray-50"
                                  >
                                    <div className="font-medium text-sm">{displayName}</div>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label htmlFor={`${role.id}-${page}-read`} className="text-xs">
                                          Read
                                        </Label>
                                        <Switch
                                          id={`${role.id}-${page}-read`}
                                          checked={pagePerms.read}
                                          disabled={!isSuperAdmin || role.is_system_role}
                                          onCheckedChange={() =>
                                            handlePermissionToggle(role.id, page, 'read')
                                          }
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <Label htmlFor={`${role.id}-${page}-write`} className="text-xs">
                                          Write
                                        </Label>
                                        <Switch
                                          id={`${role.id}-${page}-write`}
                                          checked={pagePerms.write}
                                          disabled={!isSuperAdmin || role.is_system_role}
                                          onCheckedChange={() =>
                                            handlePermissionToggle(role.id, page, 'write')
                                          }
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <Label htmlFor={`${role.id}-${page}-delete`} className="text-xs">
                                          Delete
                                        </Label>
                                        <Switch
                                          id={`${role.id}-${page}-delete`}
                                          checked={pagePerms.delete}
                                          disabled={!isSuperAdmin || role.is_system_role}
                                          onCheckedChange={() =>
                                            handlePermissionToggle(role.id, page, 'delete')
                                          }
                                        />
                                      </div>
                                      <div className="flex items-center justify-between border-t pt-2">
                                        <Label htmlFor={`${role.id}-${page}-admin`} className="text-xs font-semibold">
                                          Admin
                                        </Label>
                                        <Switch
                                          id={`${role.id}-${page}-admin`}
                                          checked={pagePerms.admin}
                                          disabled={!isSuperAdmin || role.is_system_role}
                                          onCheckedChange={() =>
                                            handlePermissionToggle(role.id, page, 'admin')
                                          }
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

