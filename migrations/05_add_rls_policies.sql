-- Migration pour ajouter les politiques RLS manquantes pour la table user_courses
-- À exécuter dans l'éditeur SQL de Supabase

-- Vérifier si RLS est activé sur la table user_courses, sinon l'activer
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_courses' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Supprimer la politique d'insertion si elle existe déjà pour la recréer
DROP POLICY IF EXISTS "Users can insert their own courses" ON public.user_courses;

-- Créer la politique d'insertion pour user_courses
CREATE POLICY "Users can insert their own courses" 
ON public.user_courses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Supprimer la politique de sélection si elle existe déjà pour la recréer
DROP POLICY IF EXISTS "Users can view their own courses" ON public.user_courses;

-- Créer la politique de sélection pour user_courses
CREATE POLICY "Users can view their own courses" 
ON public.user_courses 
FOR SELECT 
USING (auth.uid() = user_id);

-- Supprimer la politique de mise à jour si elle existe déjà pour la recréer
DROP POLICY IF EXISTS "Users can update their own courses" ON public.user_courses;

-- Créer la politique de mise à jour pour user_courses
CREATE POLICY "Users can update their own courses" 
ON public.user_courses 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Supprimer la politique de suppression si elle existe déjà pour la recréer
DROP POLICY IF EXISTS "Users can delete their own courses" ON public.user_courses;

-- Créer la politique de suppression pour user_courses
CREATE POLICY "Users can delete their own courses" 
ON public.user_courses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Mise à jour du cache de schéma pour Supabase
NOTIFY pgrst, 'reload schema';
