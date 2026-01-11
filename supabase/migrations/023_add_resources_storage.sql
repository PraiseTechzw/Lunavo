-- Create storage bucket for system resources if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-resources', 'system-resources', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for system-resources bucket

-- Anyone can view resources
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'system-resources' );

-- Admins and Peer Educator Executives can upload resources
CREATE POLICY "Executives can upload resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'system-resources' AND
  (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'peer-educator-executive', 'student-affairs')
  ))
);

-- Executives can update/delete their own uploads or all if admin
CREATE POLICY "Executives can manage resources"
ON storage.objects FOR ALL
USING (
  bucket_id = 'system-resources' AND
  (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'peer-educator-executive', 'student-affairs')
  ))
);
