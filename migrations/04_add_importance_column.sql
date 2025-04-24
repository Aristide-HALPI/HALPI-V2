-- Migration pour ajouter la colonne importance à la table user_courses
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajout de la colonne importance à la table user_courses si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public'
                   AND table_name = 'user_courses' 
                   AND column_name = 'importance') THEN
        ALTER TABLE public.user_courses ADD COLUMN importance TEXT;
    END IF;
END $$;

-- Mise à jour du cache de schéma pour Supabase
NOTIFY pgrst, 'reload schema';

-- Commentaire pour expliquer l'utilisation de la colonne
COMMENT ON COLUMN public.user_courses.importance IS 'Niveau d''importance du cours (coefficient/crédits): faible, moyen, eleve, inconnu';
