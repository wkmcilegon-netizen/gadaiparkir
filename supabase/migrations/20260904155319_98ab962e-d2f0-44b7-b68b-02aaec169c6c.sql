CREATE TYPE public.app_role AS ENUM ('dr', 'cel');
CREATE TYPE public.vehicle_status AS ENUM ('Pending', 'Jasa Parkir', 'Lunas');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_auth" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_insert_own" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal_masuk DATE NOT NULL DEFAULT CURRENT_DATE,
  jenis_kendaraan TEXT NOT NULL,
  plat_nomor TEXT NOT NULL,
  tahun INTEGER NOT NULL,
  nominal_pokok BIGINT NOT NULL DEFAULT 0,
  jasa_parkir BIGINT NOT NULL DEFAULT 0,
  status public.vehicle_status NOT NULL DEFAULT 'Pending',
  catatan TEXT,
  photo_path TEXT,
  photo_uploaded_at TIMESTAMPTZ,
  dikirim_ke_cel BOOLEAN NOT NULL DEFAULT false,
  dikonfirmasi_cel BOOLEAN NOT NULL DEFAULT false,
  dikonfirmasi_at TIMESTAMPTZ,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX vehicles_plat_idx ON public.vehicles (plat_nomor);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_select_auth" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles_insert_dr" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'dr') AND created_by = auth.uid());
CREATE POLICY "vehicles_update_auth" ON public.vehicles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'dr') OR public.has_role(auth.uid(), 'cel')) WITH CHECK (public.has_role(auth.uid(), 'dr') OR public.has_role(auth.uid(), 'cel'));
CREATE POLICY "vehicles_delete_dr" ON public.vehicles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'dr'));

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL DEFAULT auth.uid(),
  actor_username TEXT NOT NULL,
  actor_role public.app_role NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activity_logs_created_idx ON public.activity_logs (created_at DESC);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_select_auth" ON public.activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "logs_insert_own" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER vehicles_set_updated_at BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;