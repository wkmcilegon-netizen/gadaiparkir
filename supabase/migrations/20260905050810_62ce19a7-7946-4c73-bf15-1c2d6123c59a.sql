CREATE TYPE public.pengajuan_status AS ENUM ('menunggu', 'disetujui', 'ditolak');

CREATE TABLE public.pengajuan_nominal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  nominal bigint NOT NULL CHECK (nominal > 0),
  catatan text,
  status public.pengajuan_status NOT NULL DEFAULT 'menunggu',
  tanggal_kirim date NOT NULL DEFAULT CURRENT_DATE,
  diajukan_oleh uuid NOT NULL DEFAULT auth.uid(),
  diajukan_username text NOT NULL,
  diputuskan_oleh uuid,
  diputuskan_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.pengajuan_nominal TO authenticated;
GRANT ALL ON public.pengajuan_nominal TO service_role;

ALTER TABLE public.pengajuan_nominal ENABLE ROW LEVEL SECURITY;

CREATE POLICY pengajuan_select_auth ON public.pengajuan_nominal
  FOR SELECT TO authenticated USING (true);

CREATE POLICY pengajuan_insert_cel ON public.pengajuan_nominal
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'cel') AND diajukan_oleh = auth.uid());

CREATE POLICY pengajuan_update_cel_pending ON public.pengajuan_nominal
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'cel') AND diajukan_oleh = auth.uid() AND status = 'menunggu')
  WITH CHECK (public.has_role(auth.uid(), 'cel') AND diajukan_oleh = auth.uid() AND status = 'menunggu');

CREATE TRIGGER pengajuan_set_updated_at
  BEFORE UPDATE ON public.pengajuan_nominal
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.putuskan_pengajuan(_pengajuan_id uuid, _setujui boolean)
RETURNS public.pengajuan_nominal
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.pengajuan_nominal;
BEGIN
  IF NOT public.has_role(auth.uid(), 'dr') THEN
    RAISE EXCEPTION 'Hanya Dr yang boleh memutuskan pengajuan';
  END IF;

  SELECT * INTO _row FROM public.pengajuan_nominal
    WHERE id = _pengajuan_id AND archived_at IS NULL FOR UPDATE;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Pengajuan tidak ditemukan';
  END IF;
  IF _row.status <> 'menunggu' THEN
    RAISE EXCEPTION 'Pengajuan sudah diputuskan';
  END IF;

  UPDATE public.pengajuan_nominal
    SET status = CASE WHEN _setujui THEN 'disetujui'::public.pengajuan_status ELSE 'ditolak'::public.pengajuan_status END,
        diputuskan_oleh = auth.uid(),
        diputuskan_at = now()
    WHERE id = _pengajuan_id
    RETURNING * INTO _row;

  IF _setujui THEN
    UPDATE public.vehicles
      SET nominal_pokok = nominal_pokok + _row.nominal
      WHERE id = _row.vehicle_id;
  END IF;

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.putuskan_pengajuan(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.putuskan_pengajuan(uuid, boolean) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.pengajuan_nominal;