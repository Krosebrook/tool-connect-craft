
-- 1. Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Fix webhook RLS: drop permissive policies, add user-scoped ones
DROP POLICY IF EXISTS "Allow all select on webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Allow all insert on webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Allow all update on webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Allow all delete on webhooks" ON public.webhooks;

CREATE POLICY "Users can view their own webhooks"
  ON public.webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own webhooks"
  ON public.webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own webhooks"
  ON public.webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own webhooks"
  ON public.webhooks FOR DELETE USING (auth.uid() = user_id);

-- 3. Fix webhook_deliveries RLS: scope via webhook ownership
DROP POLICY IF EXISTS "Allow all select on webhook_deliveries" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Allow all insert on webhook_deliveries" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Allow all update on webhook_deliveries" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Allow all delete on webhook_deliveries" ON public.webhook_deliveries;

CREATE POLICY "Users can view deliveries for their webhooks"
  ON public.webhook_deliveries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_deliveries.webhook_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can insert deliveries for their webhooks"
  ON public.webhook_deliveries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_deliveries.webhook_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can update deliveries for their webhooks"
  ON public.webhook_deliveries FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_deliveries.webhook_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can delete deliveries for their webhooks"
  ON public.webhook_deliveries FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_deliveries.webhook_id AND w.user_id = auth.uid()));
