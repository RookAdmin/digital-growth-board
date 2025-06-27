
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type TeamMember = Tables<'team_members'>;

interface TeamMembersTableProps {
  teamMembers: TeamMember[];
}

export const TeamMembersTable = ({ teamMembers }: TeamMembersTableProps) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      case "Project Manager":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
      case "Staff":
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl text-gray-400">👥</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
        <p className="text-gray-500">Get started by inviting your first team member.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow className="border-0 bg-gray-50/50">
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Name</TableHead>
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Email</TableHead>
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Role</TableHead>
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Status</TableHead>
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Joined At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member, index) => (
            <TableRow 
              key={member.id} 
              className={`border-0 hover:bg-gray-50/30 transition-colors ${
                index < teamMembers.length - 1 ? 'border-b border-gray-100/50' : ''
              }`}
            >
              <TableCell className="font-medium text-gray-900 py-4 px-6">{member.name}</TableCell>
              <TableCell className="text-gray-600 py-4 px-6">{member.email}</TableCell>
              <TableCell className="py-4 px-6">
                <Badge variant="outline" className={getRoleBadge(member.role)}>
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-6">
                <Badge 
                  variant="outline" 
                  className={member.is_active ? 
                    "bg-green-100 text-green-800 border-green-200" : 
                    "bg-gray-100 text-gray-800 border-gray-200"
                  }
                >
                  {member.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-600 py-4 px-6">
                {member.joined_at ? format(new Date(member.joined_at), "PPP") : "Pending Invitation"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
