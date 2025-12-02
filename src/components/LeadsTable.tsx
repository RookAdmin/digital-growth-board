import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead, LeadStatus } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadDetailsModal } from "@/components/LeadDetailsModal";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceId } from "@/hooks/useWorkspaceId";

const fetchLeads = async (workspaceId: string | null): Promise<Lead[]> => {
  if (!workspaceId) return [];
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Lead[];
};

interface LeadsTableProps {
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
  singleDate?: Date;
  statusFilter?: string;
}

const statusStyles: Record<LeadStatus, string> = {
  New: "bg-gray-100 text-gray-900",
  Contacted: "bg-blue-100 text-blue-800",
  Qualified: "bg-emerald-100 text-emerald-800",
  "Proposal Sent": "bg-purple-100 text-purple-800",
  Approvals: "bg-amber-100 text-amber-800",
  Converted: "bg-black text-white",
  Dropped: "bg-red-100 text-red-700",
};

export const LeadsTable = ({
  searchTerm = "",
  startDate,
  endDate,
  singleDate,
  statusFilter = "all",
}: LeadsTableProps) => {
  const workspaceId = useWorkspaceId();
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["leads", workspaceId],
    queryFn: () => fetchLeads(workspaceId),
    enabled: !!workspaceId,
  });

  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
      const { data: currentLead, error: fetchError } = await supabase
        .from("leads")
        .select("status")
        .eq("id", leadId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const { error: updateError } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", leadId);

      if (updateError) throw new Error(updateError.message);

      if (currentLead?.status !== status) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("lead_status_history").insert({
          lead_id: leadId,
          old_status: currentLead?.status ?? null,
          new_status: status,
          changed_by: user?.id,
          changed_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["leads-with-history"] });
    },
  });

  const convertLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .maybeSingle();

      if (leadError || !lead) {
        throw new Error(leadError?.message || "Lead not found");
      }

      const { data: existingClient, error: existingClientError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", lead.email)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (existingClientError) {
        throw new Error(existingClientError.message);
      }

      if (existingClient) {
        const { error: leadUpdateError } = await supabase
          .from("leads")
          .update({ status: "Converted", client_id: existingClient.id })
          .eq("id", leadId);
        if (leadUpdateError) {
          throw new Error(leadUpdateError.message);
        }

        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("lead_status_history").insert({
          lead_id: leadId,
          old_status: lead.status,
          new_status: "Converted",
          changed_by: user?.id,
          changed_at: new Date().toISOString(),
        });

        return { wasExisting: true };
      }

      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          business_name: lead.business_name,
          lead_id: lead.id,
          services_interested: lead.services_interested,
          budget_range: lead.budget_range,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (clientError) {
        console.error("Client creation error:", clientError);
        console.error("Error details:", {
          code: clientError.code,
          message: clientError.message,
          details: clientError.details,
          hint: clientError.hint,
        });
        throw new Error(`Failed to create client: ${clientError.message}`);
      }

      if (!newClient) {
        console.error("Client insert returned no data");
        throw new Error("Client was not created successfully - no data returned");
      }

      console.log("Client created successfully:", newClient.id);

      // Create auth user for the client via Edge Function
      // This is critical for client portal access
      try {
        console.log("Calling create-client-auth Edge Function for client:", {
          client_id: newClient.id,
          email: newClient.email,
          phone: newClient.phone,
          name: newClient.name
        });

        const { data: authData, error: authError } = await supabase.functions.invoke('create-client-auth', {
          body: {
            client_id: newClient.id,
            email: newClient.email,
            phone: newClient.phone || '',
            name: newClient.name || newClient.email
          }
        });

        if (authError) {
          console.error("Failed to create auth user:", authError);
          console.error("Auth error details:", {
            message: authError.message,
            context: authError.context,
            name: authError.name
          });
          toast.error(`Client created but failed to create login credentials. Error: ${authError.message}`);
          // Don't fail the conversion, but log the error
        } else if (authData?.success) {
          console.log("Auth user created successfully for client:", newClient.email, authData);
          toast.success("Client created with login credentials! Default password: Welcome@Rook");
        } else {
          console.warn("Edge Function returned unexpected response:", authData);
          toast.warning("Client created but auth user creation status unclear. Please verify login.");
        }
      } catch (authErr: any) {
        console.error("Exception calling create-client-auth function:", authErr);
        console.error("Exception details:", {
          message: authErr?.message,
          stack: authErr?.stack,
          name: authErr?.name
        });
        toast.error(`Client created but Edge Function call failed: ${authErr?.message || 'Unknown error'}`);
        // Continue even if auth user creation fails - it can be fixed manually
      }

      const { error: projectError } = await supabase
        .from("projects")
        .insert({
          client_id: newClient.id,
          name: `${newClient.business_name || newClient.name}'s Initial Project`,
          description: `Project created from lead conversion. Services of interest: ${lead.services_interested?.join(", ") || "Not specified"}.`,
          status: "Not Started",
          workspace_id: workspaceId,
        });

      if (projectError) {
        console.error("Failed to create project for new client:", projectError);
      }

      const { error: leadUpdateError } = await supabase
        .from("leads")
        .update({ status: "Converted", client_id: newClient.id })
        .eq("id", leadId);

      if (leadUpdateError) {
        throw new Error(leadUpdateError.message);
      }

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("lead_status_history").insert({
        lead_id: leadId,
        old_status: lead.status,
        new_status: "Converted",
        changed_by: user?.id,
        changed_at: new Date().toISOString(),
      });

      return { wasExisting: false };
    },
    onSuccess: async ({ wasExisting }) => {
      toast.success(
        wasExisting
          ? "Lead linked to existing client."
          : "Lead converted to client and project created."
      );
      
      // Small delay to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Invalidate and refetch queries to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["leads-with-history"] }),
        queryClient.invalidateQueries({ queryKey: ["clients"] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ]);
      
      // Force refetch clients to ensure new client appears immediately
      await queryClient.refetchQueries({ queryKey: ["clients"] });
      
      // Also refetch leads to update the status
      await queryClient.refetchQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => {
      toast.error(`Conversion failed: ${error.message}`);
    },
  });

  const handleUpdateLeadStatus = (leadId: string, status: LeadStatus) => {
    if (status === "Converted") {
      convertLeadMutation.mutate(leadId);
    } else {
      updateStatusMutation.mutate({ leadId, status });
    }
  };

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    const term = searchTerm.toLowerCase().trim();

    return leads.filter((lead) => {
      if (lead.status === "Converted") return false;

      const matchesSearch =
        !term ||
        lead.name.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        (lead.phone && lead.phone.toLowerCase().includes(term)) ||
        (lead.business_name && lead.business_name.toLowerCase().includes(term)) ||
        (lead.lead_source && lead.lead_source.toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === "all" ||
        lead.status.toLowerCase() === statusFilter.toLowerCase();

      const createdDate = new Date(lead.created_at);
      const matchesSingleDate =
        !singleDate || createdDate.toDateString() === singleDate.toDateString();

      let matchesRange = true;
      if (startDate || endDate) {
        if (startDate) {
          matchesRange = matchesRange && createdDate >= startDate;
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          matchesRange = matchesRange && createdDate <= endOfDay;
        }
      }

      return matchesSearch && matchesStatus && matchesSingleDate && matchesRange;
    });
  }, [leads, searchTerm, statusFilter, startDate, endDate, singleDate]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-full bg-gray-100" />
        <Skeleton className="h-12 w-full bg-gray-100" />
        <Skeleton className="h-12 w-full bg-gray-100" />
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="p-6">
        <div className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
          Error fetching leads: {error.message}
        </div>
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="p-8 text-center bg-white">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
        <p className="text-gray-500">
          Capture your first lead to start building relationships.
        </p>
      </div>
    );
  }

  if (
    filteredLeads.length === 0 &&
    (searchTerm || startDate || endDate || singleDate || statusFilter !== "all")
  ) {
    return (
      <div className="p-8 text-center bg-white">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
        <p className="text-gray-500">
          No leads match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-gray-50">
              <TableHead className="font-semibold text-gray-900 py-4 px-6">
                Name
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">
                Email
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">
                Phone
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">
                Business
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">
                Status
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">
                Source
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">
                Added
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow
                key={lead.id}
                className="border-0 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-0"
                onClick={() => {
                  setSelectedLead(lead);
                  setIsModalOpen(true);
                }}
              >
                <TableCell className="font-medium text-gray-900 py-4 px-6">
                  {lead.name}
                </TableCell>
                <TableCell className="text-gray-600 py-4 px-6">
                  {lead.email}
                </TableCell>
                <TableCell className="text-gray-600 py-4 px-6">
                  {lead.phone || "-"}
                </TableCell>
                <TableCell className="text-gray-600 py-4 px-6">
                  {lead.business_name || "-"}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <Badge
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[lead.status]}`}
                  >
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600 py-4 px-6">
                  {lead.lead_source || "-"}
                </TableCell>
                <TableCell className="text-gray-600 py-4 px-6">
                  {format(new Date(lead.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right py-4 px-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLead(lead);
                      setIsModalOpen(true);
                    }}
                    className="rounded-xl border-gray-200 text-gray-900 hover:bg-gray-900 hover:text-white"
                  >
                    View lead
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        onUpdateLeadStatus={handleUpdateLeadStatus}
      />
    </>
  );
};

