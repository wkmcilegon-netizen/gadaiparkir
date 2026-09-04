CREATE POLICY "bukti_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'bukti-foto');
CREATE POLICY "bukti_insert_dr" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bukti-foto' AND public.has_role(auth.uid(), 'dr'));
CREATE POLICY "bukti_update_dr" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'bukti-foto' AND public.has_role(auth.uid(), 'dr'));
CREATE POLICY "bukti_delete_dr" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'bukti-foto' AND public.has_role(auth.uid(), 'dr'));