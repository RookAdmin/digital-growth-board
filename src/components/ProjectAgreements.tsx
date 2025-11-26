import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, X, Plus, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectAgreementsProps {
  projectId: string;
}

interface AgreementDocument {
  id?: string;
  document_type: string;
  text_content?: string;
  pdf_url?: string;
  word_link?: string;
  created_at?: string;
  updated_at?: string;
}

interface DynamicDocument {
  id: string;
  name: string;
  word_link: string;
  pdf_url?: string;
  pdf_file?: File;
}

export const ProjectAgreements = ({ projectId }: ProjectAgreementsProps) => {
  const queryClient = useQueryClient();
  const [projectOnboardPdf, setProjectOnboardPdf] = useState<File | null>(null);
  const [projectProposalText, setProjectProposalText] = useState('');
  const [projectProposalPdf, setProjectProposalPdf] = useState<File | null>(null);
  const [serviceAgreementText, setServiceAgreementText] = useState('');
  const [serviceAgreementPdf, setServiceAgreementPdf] = useState<File | null>(null);
  const [dynamicDocuments, setDynamicDocuments] = useState<DynamicDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch existing agreements
  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['project-agreements', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_agreements')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AgreementDocument[];
    },
    enabled: !!projectId,
  });

  // Initialize form with existing data
  useEffect(() => {
    if (agreements.length > 0) {
      const dynamicDocs: DynamicDocument[] = [];
      agreements.forEach((agreement) => {
        switch (agreement.document_type) {
          case 'project_proposal':
            if (agreement.text_content) {
              setProjectProposalText(agreement.text_content);
            }
            break;
          case 'service_agreement':
            if (agreement.text_content) {
              setServiceAgreementText(agreement.text_content);
            }
            break;
          case 'dynamic_document':
            // Handle dynamic documents - add to dynamicDocuments array
            dynamicDocs.push({
              id: agreement.id ? `existing_${agreement.id}` : `existing_${Date.now()}`,
              name: agreement.text_content || '',
              word_link: agreement.word_link || '',
              pdf_url: agreement.pdf_url
            });
            break;
        }
      });
      if (dynamicDocs.length > 0) {
        setDynamicDocuments(dynamicDocs);
      }
    }
  }, [agreements]);

  const uploadPdf = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('project-agreements')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('project-agreements')
      .getPublicUrl(path);

    return publicUrl;
  };

  const saveAgreement = useMutation({
    mutationFn: async (agreementData: {
      document_type: string;
      text_content?: string;
      pdf_url?: string;
      word_link?: string;
    }) => {
      // Check if agreement exists
      const { data: existing } = await supabase
        .from('project_agreements')
        .select('id')
        .eq('project_id', projectId)
        .eq('document_type', agreementData.document_type)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('project_agreements')
          .update(agreementData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('project_agreements')
          .insert({
            project_id: projectId,
            ...agreementData
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-agreements', projectId] });
      toast.success('Agreement saved successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to save agreement');
      console.error('Save error:', error);
    }
  });

  const handleSaveAll = async () => {
    setUploading(true);
    try {
      // Save Project Onboard PDF
      if (projectOnboardPdf) {
        const pdfPath = `${projectId}/project_onboard_${Date.now()}.pdf`;
        const pdfUrl = await uploadPdf(projectOnboardPdf, pdfPath);
        await saveAgreement.mutateAsync({
          document_type: 'project_onboard',
          pdf_url: pdfUrl
        });
      }

      // Save Project Proposal
      if (projectProposalText || projectProposalPdf) {
        let pdfUrl = agreements.find(a => a.document_type === 'project_proposal')?.pdf_url;
        if (projectProposalPdf) {
          const pdfPath = `${projectId}/project_proposal_${Date.now()}.pdf`;
          pdfUrl = await uploadPdf(projectProposalPdf, pdfPath);
        }
        await saveAgreement.mutateAsync({
          document_type: 'project_proposal',
          text_content: projectProposalText,
          pdf_url: pdfUrl
        });
      }

      // Save Service Agreement
      if (serviceAgreementText || serviceAgreementPdf) {
        let pdfUrl = agreements.find(a => a.document_type === 'service_agreement')?.pdf_url;
        if (serviceAgreementPdf) {
          const pdfPath = `${projectId}/service_agreement_${Date.now()}.pdf`;
          pdfUrl = await uploadPdf(serviceAgreementPdf, pdfPath);
        }
        await saveAgreement.mutateAsync({
          document_type: 'service_agreement',
          text_content: serviceAgreementText,
          pdf_url: pdfUrl
        });
      }

      // Handle deleted dynamic documents - find which ones were removed
      const existingDynamicDocIds = agreements
        .filter(a => a.document_type === 'dynamic_document')
        .map(a => a.id);
      const currentDynamicDocIds = dynamicDocuments
        .filter(doc => doc.id.startsWith('existing_'))
        .map(doc => doc.id.replace('existing_', ''));
      const deletedDocIds = existingDynamicDocIds.filter(id => !currentDynamicDocIds.includes(id));
      
      // Delete removed dynamic documents
      if (deletedDocIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('project_agreements')
          .delete()
          .in('id', deletedDocIds);
        if (deleteError) throw deleteError;
      }

      // Save Dynamic Documents (each as a separate row)
      for (const doc of dynamicDocuments) {
        if (!doc.name && !doc.word_link && !doc.pdf_file && !doc.pdf_url) {
          continue; // Skip empty documents
        }
        
        let pdfUrl = doc.pdf_url;
        if (doc.pdf_file) {
          const pdfPath = `${projectId}/dynamic_${doc.id}_${Date.now()}.pdf`;
          pdfUrl = await uploadPdf(doc.pdf_file, pdfPath);
        }
        
        // For dynamic documents, check if it's an existing one (has id starting with 'existing_')
        if (doc.id.startsWith('existing_')) {
          // Update existing dynamic document
          const existingId = doc.id.replace('existing_', '');
          const { error } = await supabase
            .from('project_agreements')
            .update({
              text_content: doc.name,
              word_link: doc.word_link,
              pdf_url: pdfUrl
            })
            .eq('id', existingId);
          if (error) throw error;
        } else {
          // Insert new dynamic document
          const { error } = await supabase
            .from('project_agreements')
            .insert({
              project_id: projectId,
              document_type: 'dynamic_document',
              text_content: doc.name,
              word_link: doc.word_link,
              pdf_url: pdfUrl
            });
          if (error) throw error;
        }
      }

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['project-agreements', projectId] });
      
      // Reset file inputs
      setProjectOnboardPdf(null);
      setProjectProposalPdf(null);
      setServiceAgreementPdf(null);
      
      toast.success('All agreements saved successfully');
    } catch (error) {
      toast.error('Failed to save agreements');
      console.error('Save error:', error);
    } finally {
      setUploading(false);
    }
  };

  const addDynamicDocument = () => {
    setDynamicDocuments([
      ...dynamicDocuments,
      {
        id: `temp_${Date.now()}`,
        name: '',
        word_link: '',
        pdf_url: undefined,
        pdf_file: undefined
      }
    ]);
  };

  const removeDynamicDocument = (id: string) => {
    setDynamicDocuments(dynamicDocuments.filter(doc => doc.id !== id));
  };

  const updateDynamicDocument = (id: string, field: keyof DynamicDocument, value: any) => {
    setDynamicDocuments(
      dynamicDocuments.map(doc =>
        doc.id === id ? { ...doc, [field]: value } : doc
      )
    );
  };

  const getExistingValue = (documentType: string, field: 'text_content' | 'pdf_url' | 'word_link') => {
    const agreement = agreements.find(a => a.document_type === documentType);
    return agreement?.[field] || '';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading agreements...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agreements & Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Onboard PDF */}
          <div className="space-y-2">
            <Label htmlFor="project-onboard">Project Onboard PDF</Label>
            <div className="flex items-center gap-4">
              <Input
                id="project-onboard"
                type="file"
                accept=".pdf"
                onChange={(e) => setProjectOnboardPdf(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {getExistingValue('project_onboard', 'pdf_url') && (
                <a
                  href={getExistingValue('project_onboard', 'pdf_url')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  View PDF
                </a>
              )}
            </div>
            {projectOnboardPdf && (
              <p className="text-sm text-gray-600">Selected: {projectOnboardPdf.name}</p>
            )}
          </div>

          {/* Project Proposal */}
          <div className="space-y-2">
            <Label htmlFor="project-proposal-text">Project Proposal</Label>
            <Textarea
              id="project-proposal-text"
              value={projectProposalText}
              onChange={(e) => setProjectProposalText(e.target.value)}
              placeholder="Enter project proposal details..."
              rows={4}
              className="w-full"
            />
            <div className="flex items-center gap-4 mt-2">
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setProjectProposalPdf(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {getExistingValue('project_proposal', 'pdf_url') && (
                <a
                  href={getExistingValue('project_proposal', 'pdf_url')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  View PDF
                </a>
              )}
            </div>
            {projectProposalPdf && (
              <p className="text-sm text-gray-600">Selected: {projectProposalPdf.name}</p>
            )}
          </div>

          {/* Service Agreement */}
          <div className="space-y-2">
            <Label htmlFor="service-agreement-text">Service Agreement</Label>
            <Textarea
              id="service-agreement-text"
              value={serviceAgreementText}
              onChange={(e) => setServiceAgreementText(e.target.value)}
              placeholder="Enter service agreement details..."
              rows={4}
              className="w-full"
            />
            <div className="flex items-center gap-4 mt-2">
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setServiceAgreementPdf(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {getExistingValue('service_agreement', 'pdf_url') && (
                <a
                  href={getExistingValue('service_agreement', 'pdf_url')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  View PDF
                </a>
              )}
            </div>
            {serviceAgreementPdf && (
              <p className="text-sm text-gray-600">Selected: {serviceAgreementPdf.name}</p>
            )}
          </div>

          {/* Dynamic Documents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Additional Documents</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDynamicDocument}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Document
              </Button>
            </div>

            {dynamicDocuments.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Document Name</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDynamicDocument(doc.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Enter document name"
                    value={doc.name}
                    onChange={(e) => updateDynamicDocument(doc.id, 'name', e.target.value)}
                  />
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Word Document Link
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={doc.word_link}
                      onChange={(e) => updateDynamicDocument(doc.id, 'word_link', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Final PDF Upload</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => updateDynamicDocument(doc.id, 'pdf_file', e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      {doc.pdf_url && (
                        <a
                          href={doc.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          View PDF
                        </a>
                      )}
                    </div>
                    {doc.pdf_file && (
                      <p className="text-sm text-gray-600">Selected: {doc.pdf_file.name}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveAll}
              disabled={uploading}
              className="bg-[#131313] hover:bg-[#222222]"
            >
              {uploading ? 'Saving...' : 'Save All Agreements'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

