
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Converted" | "Dropped";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  services_interested: string[] | null;
  budget_range: string | null;
  lead_source: string | null;
  notes: string | null;
  status: LeadStatus;
  created_at: string;
}

export interface Column {
  id: LeadStatus;
  title: LeadStatus;
  leadIds: string[];
}

export interface KanbanData {
  leads: { [key: string]: Lead };
  columns: { [key: string]: Column };
  columnOrder: LeadStatus[];
}
