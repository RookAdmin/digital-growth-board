
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientFile } from '@/types';
import { Upload, Download, Trash2, File, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface FileUploadPortalProps {
  clientId: string;
  clientName: string;
}

const fetchClientFiles = async (clientId: string): Promise<ClientFile[]> => {
  const { data, error } = await supabase
    .from('client_files')
    .select('*')
    .eq('client_id', clientId)
    .order('uploaded_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data as ClientFile[];
};

const uploadFile = async ({ file, clientId, clientName }: { file: File; clientId: string; clientName: string }) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientName}/${Date.now()}-${file.name}`;
  
  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('client-files')
    .upload(fileName, file);

  if (uploadError) throw new Error(uploadError.message);

  // Log file upload in database
  const { error: dbError } = await supabase
    .from('client_files')
    .insert({
      client_id: clientId,
      file_name: file.name,
      file_path: uploadData.path,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id
    });

  if (dbError) throw new Error(dbError.message);
};

const deleteFile = async ({ fileId, filePath }: { fileId: string; filePath: string }) => {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('client-files')
    .remove([filePath]);

  if (storageError) throw new Error(storageError.message);

  // Delete from database
  const { error: dbError } = await supabase
    .from('client_files')
    .delete()
    .eq('id', fileId);

  if (dbError) throw new Error(dbError.message);
};

const downloadFile = async (filePath: string, fileName: string) => {
  const { data, error } = await supabase.storage
    .from('client-files')
    .download(filePath);

  if (error) throw new Error(error.message);

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return <File className="h-5 w-5" />;
  
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) 
    return <FileText className="h-5 w-5" />;
  
  return <File className="h-5 w-5" />;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown size';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const FileUploadPortal = ({ clientId, clientName }: FileUploadPortalProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: files, isLoading } = useQuery({
    queryKey: ['client-files', clientId],
    queryFn: () => fetchClientFiles(clientId),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-files', clientId] });
      toast.success('File uploaded successfully!');
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-files', clientId] });
      toast.success('File deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      uploadMutation.mutate({ file, clientId, clientName });
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      uploadMutation.mutate({ file, clientId, clientName });
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = (filePath: string, fileName: string) => {
    downloadFile(filePath, fileName).catch((error) => {
      toast.error(`Download failed: ${error.message}`);
    });
  };

  const handleDelete = (fileId: string, filePath: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate({ fileId, filePath });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </CardTitle>
          <CardDescription>
            Upload brand assets, project files, and other documents for {clientName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop files here or click to browse</h3>
            <p className="text-muted-foreground mb-4">
              Supports all file types. Maximum file size: 50MB
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            {files?.length || 0} files uploaded for {clientName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading files...</p>
            </div>
          ) : files?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No files uploaded yet. Upload your first file above.
            </div>
          ) : (
            <div className="space-y-3">
              {files?.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.file_type)}
                    <div>
                      <h4 className="font-medium">{file.file_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>•</span>
                        <span>{format(parseISO(file.uploaded_at), 'PPp')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file.file_path, file.file_name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file.id, file.file_path)}
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
    </div>
  );
};
