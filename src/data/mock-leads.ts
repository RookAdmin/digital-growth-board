
import { KanbanData } from "@/types";

export const mockData: KanbanData = {
  leads: {
    'lead-1': { id: 'lead-1', name: 'John Doe', email: 'john.d@example.com', phone: '123-456-7890', source: 'Website', status: 'New', budget: '$5k - $10k' },
    'lead-2': { id: 'lead-2', name: 'Jane Smith', email: 'jane.s@example.com', phone: '234-567-8901', source: 'Referral', status: 'New' },
    'lead-3': { id: 'lead-3', name: 'Peter Jones', email: 'peter.j@example.com', phone: '345-678-9012', source: 'Ad', status: 'Contacted', budget: '$15k+' },
    'lead-4': { id: 'lead-4', name: 'Mary Johnson', email: 'mary.j@example.com', phone: '456-789-0123', source: 'Website', status: 'Qualified' },
    'lead-5': { id: 'lead-5', name: 'David Williams', email: 'david.w@example.com', phone: '567-890-1234', source: 'Referral', status: 'Proposal Sent', budget: '$20k - $30k' },
    'lead-6': { id: 'lead-6', name: 'Sarah Brown', email: 'sarah.b@example.com', phone: '678-901-2345', source: 'Ad', status: 'Converted' },
    'lead-7': { id: 'lead-7', name: 'Michael Davis', email: 'michael.d@example.com', phone: '789-012-3456', source: 'Website', status: 'Dropped' },
  },
  columns: {
    'New': { id: 'New', title: 'New', leadIds: ['lead-1', 'lead-2'] },
    'Contacted': { id: 'Contacted', title: 'Contacted', leadIds: ['lead-3'] },
    'Qualified': { id: 'Qualified', title: 'Qualified', leadIds: ['lead-4'] },
    'Proposal Sent': { id: 'Proposal Sent', title: 'Proposal Sent', leadIds: ['lead-5'] },
    'Converted': { id: 'Converted', title: 'Converted', leadIds: ['lead-6'] },
    'Dropped': { id: 'Dropped', title: 'Dropped', leadIds: ['lead-7'] },
  },
  columnOrder: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted', 'Dropped'],
};
