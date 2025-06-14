
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Converted" | "Dropped";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  budget?: string;
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
