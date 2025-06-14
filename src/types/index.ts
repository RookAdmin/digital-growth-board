
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

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  lead_id: string;
  created_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  note: string;
  created_at: string;
}

export type ProposalStatus = "Draft" | "Sent" | "Approved" | "Rejected";

export interface ProposalItem {
  id: string;
  proposal_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Proposal {
  id: string;
  client_id: string;
  title: string;
  status: ProposalStatus;
  terms: string | null;
  total_amount: number;
  signature_url: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
  clients?: { name: string; email: string };
  proposal_items?: ProposalItem[];
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
