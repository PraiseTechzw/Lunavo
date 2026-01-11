-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create categories" ON public.categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default categories
INSERT INTO public.categories (slug, name, description, icon, color)
VALUES
  ('mental-health', 'Mental Health Support', 'Stress, depression, anxiety, suicidal thoughts, and emotional wellbeing', 'medical-outline', '#8B5CF6'),
  ('substance-abuse', 'Drug & Substance Abuse', 'Support for drug and alcohol related concerns, addiction recovery', 'medkit', '#F59E0B'),
  ('sexual-health', 'Sexual & Reproductive Health (SRH)', 'Safe sex, reproductive health, and family planning', 'heart', '#EC4899'),
  ('stis-hiv', 'STIs/HIV & Safe Sex Education', 'STI prevention, HIV testing, safe sex practices, and education', 'heart-circle', '#EC4899'),
  ('family-home', 'Family & Home Challenges', 'Family health issues, home challenges, and family-related stress', 'home-outline', '#F97316'),
  ('academic', 'Academic Support & Exam Stress', 'Study stress, exam anxiety, performance, and academic challenges', 'library-outline', '#6366F1'),
  ('relationships', 'Relationship & Social Guidance', 'Dating, friendships, and interpersonal challenges', 'heart-circle', '#8B5CF6')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;
