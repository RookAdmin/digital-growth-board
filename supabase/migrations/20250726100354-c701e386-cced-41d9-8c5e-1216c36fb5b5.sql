
-- Create partners table for external freelancers/agencies
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company_name TEXT,
  service_categories TEXT[] DEFAULT '{}',
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Partners can view and update their own profile
CREATE POLICY "Partners can view own profile" ON public.partners
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Partners can update own profile" ON public.partners
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can view all partners
CREATE POLICY "Admins can view all partners" ON public.partners
  FOR SELECT USING (is_admin());

-- Admins can manage all partners
CREATE POLICY "Admins can manage partners" ON public.partners
  FOR ALL USING (is_admin());

-- Create partner_project_assignments table
CREATE TABLE public.partner_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  assigned_role TEXT,
  notes TEXT,
  assigned_by UUID REFERENCES public.team_members(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(partner_id, project_id)
);

-- Enable RLS on partner_project_assignments
ALTER TABLE public.partner_project_assignments ENABLE ROW LEVEL SECURITY;

-- Partners can view their own assignments
CREATE POLICY "Partners can view own assignments" ON public.partner_project_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = partner_project_assignments.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

-- Admins can manage all assignments
CREATE POLICY "Admins can manage assignments" ON public.partner_project_assignments
  FOR ALL USING (is_admin());

-- Create function to handle partner profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_partner_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create partner profile if user metadata indicates partner signup
  IF NEW.raw_user_meta_data ->> 'user_type' = 'partner' THEN
    INSERT INTO public.partners (
      user_id,
      full_name,
      email,
      phone,
      company_name,
      service_categories,
      location
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      NEW.email,
      NEW.raw_user_meta_data ->> 'phone',
      NEW.raw_user_meta_data ->> 'company_name',
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'service_categories' IS NOT NULL 
        THEN string_to_array(NEW.raw_user_meta_data ->> 'service_categories', ',')
        ELSE '{}'
      END,
      NEW.raw_user_meta_data ->> 'location'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for partner signup
CREATE TRIGGER on_partner_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_partner_signup();

-- Add updated_at trigger to partners table
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
