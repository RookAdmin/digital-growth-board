
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useClientAuth } from '@/hooks/useClientAuth';
import { CheckCircle, Clock } from 'lucide-react';

export const ClientOnboardingProgress = () => {
  const { clientUser } = useClientAuth();

  const { data: onboardingData, isLoading } = useQuery({
    queryKey: ['client-onboarding', clientUser?.client_id],
    queryFn: async () => {
      if (!clientUser?.client_id) return null;
      
      const { data, error } = await supabase
        .from('client_onboarding_data')
        .select('*')
        .eq('client_id', clientUser.client_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!clientUser?.client_id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = onboardingData?.progress || 0;
  const isComplete = progress >= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="h-5 w-5 text-[#131313]" />
          ) : (
            <Clock className="h-5 w-5 text-[#222222]" />
          )}
          Onboarding Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
        
        {onboardingData && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Company:</span>
                <p className="text-muted-foreground">
                  {onboardingData.company_name || 'Not provided'}
                </p>
              </div>
              <div>
                <span className="font-medium">Target Audience:</span>
                <p className="text-muted-foreground">
                  {onboardingData.target_audience || 'Not provided'}
                </p>
              </div>
            </div>
            
            {onboardingData.business_goals && (
              <div>
                <span className="font-medium">Business Goals:</span>
                <p className="text-muted-foreground text-xs mt-1">
                  {onboardingData.business_goals}
                </p>
              </div>
            )}
          </div>
        )}
        
        {!isComplete && (
          <p className="text-sm text-muted-foreground">
            Complete your onboarding to unlock all portal features.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
