import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Users, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface AddMeetingSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMeetingSlotDialog({ open, onOpenChange, onSuccess }: AddMeetingSlotDialogProps) {
  const [meetingTitle, setMeetingTitle] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [otherEmails, setOtherEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembersOpen, setTeamMembersOpen] = useState(false);
  const [partnersOpen, setPartnersOpen] = useState(false);

  const { data: teamMembers } = useQuery({
    queryKey: ['team-members-for-meeting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name, email')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: partners } = useQuery({
    queryKey: ['partners-for-meeting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, full_name, email')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const handleAddEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emailInput.trim()) {
      e.preventDefault();
      const email = emailInput.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (!otherEmails.includes(email)) {
          setOtherEmails([...otherEmails, email]);
          setEmailInput("");
        }
      } else {
        toast.error("Please enter a valid email address");
      }
    }
  };

  const handleRemoveEmail = (email: string) => {
    setOtherEmails(otherEmails.filter(e => e !== email));
  };

  const handleSubmit = async () => {
    if (!meetingTitle || !date || !time) {
      toast.error("Please fill in meeting title, date, and time");
      return;
    }

    setIsSubmitting(true);
    try {
      const [hours, minutes] = time.split(':');
      const dateTime = new Date(date);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const invitees = [
        ...selectedTeamMembers.map(id => {
          const member = teamMembers?.find(m => m.id === id);
          return { type: 'team_member', email: member?.email, name: member?.name };
        }),
        ...selectedPartners.map(id => {
          const partner = partners?.find(p => p.id === id);
          return { type: 'partner', email: partner?.email, name: partner?.full_name };
        }),
        ...otherEmails.map(email => ({ type: 'other', email, name: email })),
      ];

      const { error } = await supabase.from('meeting_slots').insert({
        meeting_type: meetingTitle,
        date_time: dateTime.toISOString(),
        duration_minutes: parseInt(duration),
        status: 'available',
        notes: `Invitees: ${invitees.map(i => i.name).join(', ')}`,
      });

      if (error) throw error;

      toast.success("Meeting slot created successfully");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setMeetingTitle("");
      setDate(undefined);
      setTime("");
      setDuration("60");
      setSelectedTeamMembers([]);
      setSelectedPartners([]);
      setOtherEmails([]);
    } catch (error) {
      console.error("Error creating meeting slot:", error);
      toast.error("Failed to create meeting slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Meeting Slot</DialogTitle>
          <DialogDescription>Create a new meeting slot and invite participants</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Kickoff Meeting, Review Session"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Invite Team Members
            </Label>
            <Popover open={teamMembersOpen} onOpenChange={setTeamMembersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {selectedTeamMembers.length > 0 
                    ? `${selectedTeamMembers.length} team member(s) selected`
                    : "Select team members"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search team members..." />
                  <CommandList>
                    <CommandEmpty>No team members found.</CommandEmpty>
                    <CommandGroup>
                      {teamMembers?.map((member) => (
                        <CommandItem
                          key={member.id}
                          onSelect={() => {
                            setSelectedTeamMembers(prev =>
                              prev.includes(member.id)
                                ? prev.filter(id => id !== member.id)
                                : [...prev, member.id]
                            );
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedTeamMembers.includes(member.id)}
                              onChange={() => {}}
                              className="h-4 w-4"
                            />
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedTeamMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTeamMembers.map(id => {
                  const member = teamMembers?.find(m => m.id === id);
                  return (
                    <Badge key={id} variant="secondary">
                      {member?.name}
                      <button
                        onClick={() => setSelectedTeamMembers(prev => prev.filter(i => i !== id))}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Invite Partners
            </Label>
            <Popover open={partnersOpen} onOpenChange={setPartnersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {selectedPartners.length > 0 
                    ? `${selectedPartners.length} partner(s) selected`
                    : "Select partners"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search partners..." />
                  <CommandList>
                    <CommandEmpty>No partners found.</CommandEmpty>
                    <CommandGroup>
                      {partners?.map((partner) => (
                        <CommandItem
                          key={partner.id}
                          onSelect={() => {
                            setSelectedPartners(prev =>
                              prev.includes(partner.id)
                                ? prev.filter(id => id !== partner.id)
                                : [...prev, partner.id]
                            );
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedPartners.includes(partner.id)}
                              onChange={() => {}}
                              className="h-4 w-4"
                            />
                            <div>
                              <div className="font-medium">{partner.full_name}</div>
                              <div className="text-xs text-gray-500">{partner.email}</div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedPartners.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPartners.map(id => {
                  const partner = partners?.find(p => p.id === id);
                  return (
                    <Badge key={id} variant="secondary">
                      {partner?.full_name}
                      <button
                        onClick={() => setSelectedPartners(prev => prev.filter(i => i !== id))}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="others">Invite Others (Email)</Label>
            <Input
              id="others"
              type="email"
              placeholder="Enter email and press Enter"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleAddEmail}
            />
            {otherEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {otherEmails.map(email => (
                  <Badge key={email} variant="secondary">
                    {email}
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Meeting Slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
