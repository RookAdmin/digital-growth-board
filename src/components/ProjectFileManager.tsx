
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile } from '@/types';
import { format } from 'date-fns';
import { Upload, Download, FileText, Image, Archive, Trash2, File } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectFileManagerProps {
  projectId: string;
  projectName: string;
}

export const ProjectFileManager = ({ projectId, projectName }: ProjectFileManagerProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as ProjectFile[];
    }
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { data, error } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
          uploaded_by_name: 'Current User',
          uploaded_by_email: 'user@example.com'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast.success('File uploaded successfully');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      toast.error('Failed to upload file');
      console.error('Upload error:', error);
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  const deleteFile = useMutation({
    mutationFn: async (file: ProjectFile) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast.success('File deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete file');
      console.error('Delete error:', error);
    }
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('project-file-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_files',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);
      uploadFile.mutate(file);
    }
  };

  const handleDownload = async (file: ProjectFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
      console.error('Download error:', error);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-5 w-5" />;
    
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType.includes('pdf') || fileType.includes('text')) return <FileText className="h-5 w-5" />;
    if (fileType.includes('zip') || fileType.includes('archive')) return <Archive className="h-5 w-5" />;
    
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Project Files - {projectName}
          </CardTitle>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No files uploaded yet.</p>
            <p className="text-sm text-muted-foreground">Click "Upload File" to add project files.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors animate-fade-in"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-muted-foreground">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file_name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>by {file.uploaded_by_name}</span>
                      <span>{format(new Date(file.uploaded_at), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  {file.file_type && (
                    <Badge variant="outline" className="text-xs">
                      {file.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteFile.mutate(file)}
                    disabled={deleteFile.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
