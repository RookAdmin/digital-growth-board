
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
        return "bg-primary text-primary-foreground hover:bg-primary/80";
      case "Project Manager":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "Staff":
        return "bg-gray-500 text-white hover:bg-gray-600";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <Badge className={getRoleBadge(member.role)}>{member.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={member.is_active ? "default" : "outline"} className={member.is_active ? "bg-green-100 text-green-800" : ""}>
                  {member.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                {member.joined_at ? format(new Date(member.joined_at), "PPP") : "Pending Invitation"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
