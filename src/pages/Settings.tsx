import { useEffect, useState } from "react";
import { Header } from '@/components/Header';
import { DockNav } from '@/components/DockNav';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Save, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { LoadingState } from '@/components/LoadingState';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface LeadStatus {
  id: string;
  workspace_id: string;
  name: string;
  display_order: number;
  color: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Settings = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { hasPermission } = useUserPermissions();
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6366f1');
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusName, setEditingStatusName] = useState('');

  useEffect(() => {
    document.title = "Settings - Rook";
  }, []);

  // Get current user role to check if Super Admin
  const { data: userRole } = useQuery({
    queryKey: ['userRole', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .maybeSingle();
      return data?.role || null;
    },
    enabled: !!workspaceId,
  });

  // Check if user can manage lead statuses
  // Super Admin always has access, otherwise check permission
  const canManageStatuses = userRole === 'Super Admin' || hasPermission('manage_lead_statuses', 'write');

  // Fetch lead statuses
  const { data: leadStatuses = [], isLoading, refetch: refetchStatuses } = useQuery({
    queryKey: ['lead-statuses', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      // Use type assertion since lead_statuses table types haven't been generated yet
      const { data, error } = await (supabase as any)
        .from('lead_statuses')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      // If no statuses exist and user has permission, create the 3 default ones
      if ((data || []).length === 0 && (userRole === 'Super Admin' || hasPermission('manage_lead_statuses', 'write'))) {
        const { error: createError } = await supabase.rpc('create_default_lead_statuses', {
          workspace_uuid: workspaceId
        });
        if (createError) {
          console.error('Failed to create default statuses:', createError);
        } else {
          // Refetch after creating defaults
          const { data: newData, error: refetchError } = await (supabase as any)
            .from('lead_statuses')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('is_active', true)
            .order('display_order', { ascending: true });
          
          if (refetchError) throw refetchError;
          return (newData || []) as LeadStatus[];
        }
      }
      
      return (data || []) as LeadStatus[];
    },
    enabled: !!workspaceId, // Don't wait for userRole - it's only needed for permission check inside
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    staleTime: 0, // Always consider data stale to ensure fresh data on reload
    gcTime: 0, // Don't cache to ensure fresh data (gcTime replaces cacheTime in newer versions)
  });

  // Update local state when data changes
  useEffect(() => {
    if (leadStatuses && leadStatuses.length > 0) {
      // Sort by display_order to ensure correct order
      const sorted = [...leadStatuses].sort((a, b) => a.display_order - b.display_order);
      setStatuses(sorted);
    } else if (leadStatuses && leadStatuses.length === 0) {
      setStatuses([]);
    }
  }, [leadStatuses]);

  // Force refetch on mount to ensure data is fresh
  useEffect(() => {
    if (workspaceId && userRole) {
      refetchStatuses();
    }
  }, [workspaceId, userRole, refetchStatuses]);

  // Create new status mutation
  const createStatusMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      
      // Get max display_order
      const maxOrder = statuses.length > 0 
        ? Math.max(...statuses.map(s => s.display_order)) 
        : -1;

      const { data, error } = await (supabase as any)
        .from('lead_statuses')
        .insert({
          workspace_id: workspaceId,
          name: name.trim(),
          color,
          display_order: maxOrder + 1,
          is_default: false,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      // Invalidate and refetch to ensure UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ['lead-statuses', workspaceId] });
      await queryClient.refetchQueries({ queryKey: ['lead-statuses', workspaceId] });
      setNewStatusName('');
      setNewStatusColor('#6366f1');
      toast.success('Lead status created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create status: ${error.message}`);
    },
  });

  // Update status order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (updatedStatuses: LeadStatus[]) => {
      if (!workspaceId) throw new Error('No workspace ID');
      
      const updates = updatedStatuses.map((status, index) => ({
        id: status.id,
        display_order: index,
      }));

      // Update all statuses in a transaction
      const promises = updates.map(update =>
        (supabase as any)
          .from('lead_statuses')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error('Failed to update some status orders');
      }
    },
    onSuccess: async () => {
      // Invalidate and refetch to ensure UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ['lead-statuses', workspaceId] });
      await queryClient.refetchQueries({ queryKey: ['lead-statuses', workspaceId] });
      toast.success('Status order updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update order: ${error.message}`);
    },
  });

  // Delete status mutation
  const deleteStatusMutation = useMutation({
    mutationFn: async (statusId: string) => {
      const { error } = await (supabase as any)
        .from('lead_statuses')
        .update({ is_active: false })
        .eq('id', statusId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-statuses', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // Refresh leads to update statuses
      toast.success('Status deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete status: ${error.message}`);
    },
  });

  // Update status color mutation
  const updateColorMutation = useMutation({
    mutationFn: async ({ id, color }: { id: string; color: string }) => {
      const { error } = await (supabase as any)
        .from('lead_statuses')
        .update({ color })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-statuses', workspaceId] });
      toast.success('Status color updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update color: ${error.message}`);
    },
  });

  // Update status name mutation
  const updateNameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!name.trim()) {
        throw new Error('Status name cannot be empty');
      }
      
      // Check if name already exists (excluding current status)
      const { data: existing } = await (supabase as any)
        .from('lead_statuses')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('name', name.trim())
        .eq('is_active', true)
        .neq('id', id)
        .maybeSingle();
      
      if (existing) {
        throw new Error('A status with this name already exists');
      }

      const { error } = await (supabase as any)
        .from('lead_statuses')
        .update({ name: name.trim() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-statuses', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // Refresh leads to update status names
      toast.success('Status name updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update name: ${error.message}`);
    },
  });

  const handleCreateStatus = () => {
    if (!newStatusName.trim()) {
      toast.error('Please enter a status name');
      return;
    }

    if (statuses.some(s => s.name.toLowerCase() === newStatusName.trim().toLowerCase())) {
      toast.error('A status with this name already exists');
      return;
    }

    createStatusMutation.mutate({ name: newStatusName, color: newStatusColor });
  };

  const handleDeleteStatus = (status: LeadStatus) => {
    if (status.is_default) {
      toast.error('Cannot delete default statuses (New, Converted, Dropped)');
      return;
    }

    if (confirm(`Are you sure you want to delete "${status.name}"? This will not affect existing leads.`)) {
      deleteStatusMutation.mutate(status.id);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    // If dropped in the same position, do nothing
    if (result.destination.index === result.source.index) return;

    const items = Array.from(statuses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display_order for all items (including default statuses)
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index,
    }));

    // Optimistically update UI
    setStatuses(updatedItems);
    
    // Update in database
    updateOrderMutation.mutate(updatedItems, {
      onError: () => {
        // Revert on error by refetching
        refetchStatuses();
      }
    });
  };

  const handleColorChange = (statusId: string, color: string) => {
    updateColorMutation.mutate({ id: statusId, color });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <LoadingState message="Loading settings..." fullHeight />
        </main>
        <DockNav />
      </div>
    );
  }

  // Statuses are already sorted by display_order from the query
  // All statuses (default and custom) can be reordered together

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-32">
      <Header isAuthenticated={true} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your workspace settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Lead Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Status Management</CardTitle>
              <CardDescription>
                Customize lead status columns for your workspace. Default statuses (New, Converted, Dropped) cannot be deleted but can be reordered.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!canManageStatuses && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    You don't have permission to manage lead statuses. Contact your administrator.
                  </p>
                </div>
              )}

              {/* All Statuses - Default and Custom (can all be reordered) */}
              {canManageStatuses && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Lead Statuses (Drag to reorder - Default statuses cannot be deleted)
                    </Label>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="all-statuses">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {statuses.map((status, index) => (
                              <Draggable
                                key={status.id}
                                draggableId={status.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: snapshot.isDragging ? 0.8 : 1,
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing ${
                                      status.is_default 
                                        ? 'bg-gray-50 border-gray-200' 
                                        : 'bg-white border-gray-200'
                                    } ${
                                      snapshot.isDragging ? 'shadow-md border-blue-300' : ''
                                    }`}
                                  >
                                    <div
                                      className="text-gray-400 hover:text-gray-600"
                                      style={{ touchAction: 'none', pointerEvents: 'none' }}
                                    >
                                      <GripVertical className="h-5 w-5" />
                                    </div>
                                    <div
                                      className="w-4 h-4 rounded-full border-2 border-gray-300"
                                      style={{ backgroundColor: status.color }}
                                    />
                                    {editingStatusId === status.id ? (
                                      <div className="flex-1 flex items-center gap-2">
                                        <Input
                                          value={editingStatusName}
                                          onChange={(e) => setEditingStatusName(e.target.value)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              updateNameMutation.mutate({ id: status.id, name: editingStatusName });
                                              setEditingStatusId(null);
                                            } else if (e.key === 'Escape') {
                                              setEditingStatusId(null);
                                              setEditingStatusName('');
                                            }
                                          }}
                                          className="flex-1 h-8"
                                          autoFocus
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            updateNameMutation.mutate({ id: status.id, name: editingStatusName });
                                            setEditingStatusId(null);
                                          }}
                                          disabled={updateNameMutation.isPending}
                                        >
                                          <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingStatusId(null);
                                            setEditingStatusName('');
                                          }}
                                        >
                                          <X className="h-4 w-4 text-red-600" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex-1 flex items-center gap-2">
                                        <span className="font-medium text-gray-900">
                                          {status.name}
                                          {status.is_default && (
                                            <span className="ml-2 text-xs text-gray-500">(Default)</span>
                                          )}
                                        </span>
                                        {!status.is_default && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setEditingStatusId(status.id);
                                              setEditingStatusName(status.name);
                                            }}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Edit2 className="h-3 w-3 text-gray-500" />
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                    <input
                                      type="color"
                                      value={status.color}
                                      onChange={(e) => handleColorChange(status.id, e.target.value)}
                                      className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                                    />
                                    {!status.is_default && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteStatus(status)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>

                  {/* Add New Status */}
                  <div className="border-t pt-6">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Add New Status
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Status name (e.g., Follow-up, Negotiating)"
                        value={newStatusName}
                        onChange={(e) => setNewStatusName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateStatus();
                          }
                        }}
                        className="flex-1"
                      />
                      <input
                        type="color"
                        value={newStatusColor}
                        onChange={(e) => setNewStatusColor(e.target.value)}
                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Button
                        onClick={handleCreateStatus}
                        disabled={createStatusMutation.isPending}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Read-only view for users without permission */}
              {!canManageStatuses && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Lead Statuses
                  </Label>
                  <div className="space-y-2">
                    {statuses.map((status) => (
                      <div
                        key={status.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="flex-1 font-medium text-gray-900">
                          {status.name}
                          {status.is_default && (
                            <span className="ml-2 text-xs text-gray-500">(Default)</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <DockNav />
    </div>
  );
};

export default Settings;

