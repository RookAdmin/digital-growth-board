
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { TaskComment } from '@/types';
import { format } from 'date-fns';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

interface TaskCommentsProps {
  taskId: string;
  taskTitle: string;
}

export const TaskComments = ({ taskId, taskTitle }: TaskCommentsProps) => {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TaskComment[];
    }
  });

  const addComment = useMutation({
    mutationFn: async (comment: string) => {
      // For demo purposes, using static user data
      // In a real app, this would come from auth context
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_name: 'Current User',
          user_email: 'user@example.com',
          comment: comment.trim()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      setNewComment('');
      toast.success('Comment added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add comment');
      console.error('Comment add error:', error);
    }
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('task-comment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      addComment.mutate(newComment);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Comments for "{taskTitle}"
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to add feedback!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg animate-fade-in">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM dd, yyyy at HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm">{comment.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <div className="space-y-3 border-t pt-4">
          <Textarea
            placeholder="Add your feedback or comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || addComment.isPending}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {addComment.isPending ? 'Adding Comment...' : 'Add Comment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
