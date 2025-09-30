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

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string | null;
  notes: string | null;
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
  services_interested: string[] | null;
  budget_range: string | null;
  onboarding_status: string;
}

export interface ClientOnboardingData {
  id: string;
  client_id: string;
  company_name: string | null;
  social_media_links: { platform: string; url: string }[] | null;
  business_goals: string | null;
  brand_assets_url: string | null;
  target_audience: string | null;
  competitor_info: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
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

export interface MeetingSlot {
  id: string;
  date_time: string;
  duration_minutes: number;
  status: 'available' | 'booked' | 'cancelled';
  client_id: string | null;
  meeting_type: string | null;
  notes: string | null;
  meeting_link: string | null;
  created_at: string;
  updated_at: string;
  clients?: { name:string; email: string };
}

export interface ClientFile {
  id: string;
  client_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

export type ProjectStatus = "Not Started" | "In Progress" | "Review" | "Completed";
export type TaskStatus = "Not Started" | "In Progress" | "Completed" | "Blocked";
export type TaskType = "new" | "bug" | "testing" | "task" | "milestone";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  deadline: string | null;
  assigned_team_members: string[] | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
  clients?: { name: string; email: string; business_name: string | null };
  tasks?: { id: string; status: TaskStatus }[];
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  description_image_url: string | null;
  remarks: string | null;
  remarks_image_url: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_team_members: string[] | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_name: string;
  user_email: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by_name: string;
  uploaded_by_email: string;
  uploaded_at: string;
}

export interface ProjectMessage {
  id: string;
  project_id: string;
  user_name: string;
  user_email: string;
  message: string;
  message_type: 'text' | 'file' | 'system';
  created_at: string;
  updated_at: string;
}

export type ActivityType = 'task_created' | 'task_updated' | 'task_completed' | 'file_uploaded' | 'file_deleted' | 'message_sent' | 'project_updated' | 'comment_added';

export interface ActivityLog {
  id: string;
  project_id: string;
  activity_type: ActivityType;
  user_name: string;
  user_email: string;
  description: string;
  metadata: Record<string, any>;
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
