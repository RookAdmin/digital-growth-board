
-- Enable cascade delete for clients and their related data.
-- WARNING: This will permanently delete all data associated with a client when they are deleted.

-- When a TASK is deleted, delete its comments
ALTER TABLE public.task_comments DROP CONSTRAINT IF EXISTS task_comments_task_id_fkey;
ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

-- When a PROJECT is deleted, delete its related data
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_files DROP CONSTRAINT IF EXISTS project_files_project_id_fkey;
ALTER TABLE public.project_files ADD CONSTRAINT project_files_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_messages DROP CONSTRAINT IF EXISTS project_messages_project_id_fkey;
ALTER TABLE public.project_messages ADD CONSTRAINT project_messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_project_id_fkey;
ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.team_member_projects DROP CONSTRAINT IF EXISTS team_member_projects_project_id_fkey;
ALTER TABLE public.team_member_projects ADD CONSTRAINT team_member_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Invoices can be associated with a project, but are nullable. If project is deleted, set project_id to NULL.
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_project_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- When an INVOICE is deleted, delete its related data
ALTER TABLE public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;
ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

-- When a PROPOSAL is deleted, delete its items
ALTER TABLE public.proposal_items DROP CONSTRAINT IF EXISTS proposal_items_proposal_id_fkey;
ALTER TABLE public.proposal_items ADD CONSTRAINT proposal_items_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE CASCADE;


-- When a CLIENT is deleted, cascade delete their projects, invoices, etc.

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_client_id_fkey;
ALTER TABLE public.proposals ADD CONSTRAINT proposals_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.client_onboarding_data DROP CONSTRAINT IF EXISTS client_onboarding_data_client_id_fkey;
ALTER TABLE public.client_onboarding_data ADD CONSTRAINT client_onboarding_data_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.client_users DROP CONSTRAINT IF EXISTS client_users_client_id_fkey;
ALTER TABLE public.client_users ADD CONSTRAINT client_users_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.client_files DROP CONSTRAINT IF EXISTS client_files_client_id_fkey;
ALTER TABLE public.client_files ADD CONSTRAINT client_files_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- For meeting slots, we can set client to NULL if client is deleted.
ALTER TABLE public.meeting_slots DROP CONSTRAINT IF EXISTS meeting_slots_client_id_fkey;
ALTER TABLE public.meeting_slots ADD CONSTRAINT meeting_slots_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

