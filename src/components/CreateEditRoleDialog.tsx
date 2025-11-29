import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Role, PermissionsSchema, PermissionAction, PERMISSION_CATEGORIES, PagePermissions } from '@/types/permissions';

interface CreateEditRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  onSuccess: () => void;
  permissionsSchema: PermissionsSchema | undefined;
}

export const CreateEditRoleDialog = ({
  isOpen,
  onClose,
  role,
  onSuccess,
  permissionsSchema,
}: CreateEditRoleDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAssignable, setIsAssignable] = useState(true);
  const [permissions, setPermissions] = useState<Role['permissions']>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      setIsAssignable(role.is_assignable);
      setPermissions(role.permissions);
    } else {
      // Initialize with default empty permissions
      const defaultPerms: Role['permissions'] = {};
      if (permissionsSchema) {
        Object.values(permissionsSchema).forEach(category => {
          Object.keys(category).forEach(page => {
            defaultPerms[page] = { read: false, write: false, delete: false, admin: false };
          });
        });
      }
      setName('');
      setDescription('');
      setIsAssignable(true);
      setPermissions(defaultPerms);
    }
  }, [role, permissionsSchema]);

  const createRoleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('create_role', {
        role_name: name,
        role_description: description,
        role_permissions: permissions,
        role_is_assignable: isAssignable,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate both roles queries to update all components
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
      toast.success('Role created successfully');
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create role: ${error.message}`);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      if (!role) throw new Error('No role to update');
      const { error } = await supabase.rpc('update_role', {
        role_id: role.id,
        role_name: name,
        role_description: description,
        role_permissions: permissions,
        role_is_assignable: isAssignable,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate both roles queries to update all components
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
      toast.success('Role updated successfully');
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const handlePermissionToggle = (page: string, action: PermissionAction) => {
    const newPermissions = { ...permissions };
    if (!newPermissions[page]) {
      newPermissions[page] = { read: false, write: false, delete: false, admin: false };
    }

    newPermissions[page][action] = !newPermissions[page][action];

    // If admin is enabled, enable all other permissions
    if (action === 'admin' && newPermissions[page][action]) {
      newPermissions[page] = { read: true, write: true, delete: true, admin: true };
    }

    setPermissions(newPermissions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (role) {
      updateRoleMutation.mutate();
    } else {
      createRoleMutation.mutate();
    }
  };

  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {role
              ? 'Update the role name, description, and permissions.'
              : 'Create a new role with custom permissions for team members.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name *</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Content Manager"
                required
disabled={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role and its responsibilities"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-assignable"
                checked={isAssignable}
                onCheckedChange={setIsAssignable}
disabled={false}
              />
              <Label htmlFor="is-assignable">Can be assigned to team members</Label>
            </div>
          </div>

          {permissionsSchema && (
            <div className="space-y-6 border-t pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Permissions</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure what this role can access and modify across the platform.
                </p>
              </div>

              <div className="space-y-6">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(categoryPages).map(([page, displayName]) => {
                          const pagePerms = permissions[page] || {
                            read: false,
                            write: false,
                            delete: false,
                            admin: false,
                          };

                          return (
                            <div
                              key={page}
                              className="border rounded-md p-4 space-y-3 bg-gray-50"
                            >
                              <div className="font-medium text-sm">{displayName}</div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`${page}-read`} className="text-xs">
                                    Read
                                  </Label>
                                  <Switch
                                    id={`${page}-read`}
                                    checked={pagePerms.read}
                                    onCheckedChange={() => handlePermissionToggle(page, 'read')}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`${page}-write`} className="text-xs">
                                    Write
                                  </Label>
                                  <Switch
                                    id={`${page}-write`}
                                    checked={pagePerms.write}
                                    onCheckedChange={() => handlePermissionToggle(page, 'write')}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`${page}-delete`} className="text-xs">
                                    Delete
                                  </Label>
                                  <Switch
                                    id={`${page}-delete`}
                                    checked={pagePerms.delete}
                                    onCheckedChange={() => handlePermissionToggle(page, 'delete')}
                                  />
                                </div>
                                <div className="flex items-center justify-between border-t pt-2">
                                  <Label htmlFor={`${page}-admin`} className="text-xs font-semibold">
                                    Admin
                                  </Label>
                                  <Switch
                                    id={`${page}-admin`}
                                    checked={pagePerms.admin}
                                    onCheckedChange={() => handlePermissionToggle(page, 'admin')}
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
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

