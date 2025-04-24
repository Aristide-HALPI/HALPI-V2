-- Migration pour ajouter le support des chapitres de cours et l'importance des cours
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajout du champ importance à la table user_courses s'il n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_courses' 
                   AND column_name = 'importance') THEN
        ALTER TABLE public.user_courses ADD COLUMN importance TEXT;
    END IF;
END $$;

-- Création de la table des chapitres si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    source_url TEXT,
    chapter_type TEXT NOT NULL DEFAULT 'savoir',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout d'un trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chapters_modtime
BEFORE UPDATE ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Création du bucket pour les fichiers de chapitres
-- Note: Cette partie doit être exécutée manuellement dans l'interface Supabase Storage
-- 1. Créer un nouveau bucket nommé 'chapter_files'
-- 2. Définir les permissions RLS appropriées

-- Création du bucket pour les fichiers de cours complets
-- Note: Cette partie doit être exécutée manuellement dans l'interface Supabase Storage
-- 1. Créer un nouveau bucket nommé 'course_files'
-- 2. Définir les permissions RLS appropriées

-- Ajout des politiques RLS pour la table des chapitres
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre à l'utilisateur de voir ses propres chapitres
-- et ceux des cours auxquels il est inscrit
CREATE POLICY "Users can view chapters of their courses"
ON public.chapters
FOR SELECT
USING (
    course_id IN (
        SELECT course_id FROM public.user_courses
        WHERE user_id = auth.uid()
    )
);

-- Politique pour permettre à l'utilisateur d'insérer des chapitres pour ses cours
CREATE POLICY "Users can insert chapters for their courses"
ON public.chapters
FOR INSERT
WITH CHECK (
    course_id IN (
        SELECT course_id FROM public.user_courses
        WHERE user_id = auth.uid()
    )
);

-- Politique pour permettre à l'utilisateur de mettre à jour ses propres chapitres
CREATE POLICY "Users can update their own chapters"
ON public.chapters
FOR UPDATE
USING (
    course_id IN (
        SELECT course_id FROM public.user_courses
        WHERE user_id = auth.uid()
    )
);

-- Politique pour permettre à l'utilisateur de supprimer ses propres chapitres
CREATE POLICY "Users can delete their own chapters"
ON public.chapters
FOR DELETE
USING (
    course_id IN (
        SELECT course_id FROM public.user_courses
        WHERE user_id = auth.uid()
    )
);

-- Création de la table pour suivre la progression par chapitre
CREATE TABLE IF NOT EXISTS public.chapter_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_studied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chapter_id)
);

-- Ajout d'un trigger pour mettre à jour le timestamp updated_at
CREATE TRIGGER update_chapter_progress_modtime
BEFORE UPDATE ON public.chapter_progress
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Ajout des politiques RLS pour la table de progression des chapitres
ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre à l'utilisateur de voir sa propre progression
CREATE POLICY "Users can view their own chapter progress"
ON public.chapter_progress
FOR SELECT
USING (user_id = auth.uid());

-- Politique pour permettre à l'utilisateur d'insérer sa propre progression
CREATE POLICY "Users can insert their own chapter progress"
ON public.chapter_progress
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Politique pour permettre à l'utilisateur de mettre à jour sa propre progression
CREATE POLICY "Users can update their own chapter progress"
ON public.chapter_progress
FOR UPDATE
USING (user_id = auth.uid());

-- Politique pour permettre à l'utilisateur de supprimer sa propre progression
CREATE POLICY "Users can delete their own chapter progress"
ON public.chapter_progress
FOR DELETE
USING (user_id = auth.uid());

-- Création d'une vue pour faciliter la récupération des informations de cours avec chapitres
CREATE OR REPLACE VIEW public.courses_with_chapters AS
SELECT 
    c.id AS course_id,
    c.name AS course_name,
    c.description AS course_description,
    c.image_url,
    uc.user_id,
    uc.exam_date,
    uc.difficulty,
    uc.estimated_time,
    COUNT(ch.id) AS chapter_count,
    COALESCE(
        (SELECT AVG(cp.progress_percentage)
         FROM public.chapter_progress cp
         JOIN public.chapters ch2 ON cp.chapter_id = ch2.id
         WHERE ch2.course_id = c.id AND cp.user_id = uc.user_id),
        0
    ) AS overall_progress
FROM 
    public.courses c
JOIN 
    public.user_courses uc ON c.id = uc.course_id
LEFT JOIN 
    public.chapters ch ON c.id = ch.course_id
GROUP BY 
    c.id, c.name, c.description, c.image_url, uc.user_id, uc.exam_date, uc.difficulty, uc.estimated_time;

-- Ajout d'une fonction pour calculer la progression globale d'un cours
CREATE OR REPLACE FUNCTION calculate_course_progress(course_uuid UUID, user_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    progress NUMERIC;
BEGIN
    SELECT COALESCE(AVG(cp.progress_percentage), 0)
    INTO progress
    FROM public.chapter_progress cp
    JOIN public.chapters ch ON cp.chapter_id = ch.id
    WHERE ch.course_id = course_uuid AND cp.user_id = user_uuid;
    
    RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- Ajout d'un index pour améliorer les performances des requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_chapters_course_id ON public.chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_user_id ON public.chapter_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_chapter_id ON public.chapter_progress(chapter_id);
