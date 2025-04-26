-- Script pour ajouter la colonne content_type à la table chapters
-- À exécuter dans l'interface SQL de Supabase

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'chapters' AND column_name = 'content_type'
    ) THEN
        -- Ajouter la colonne content_type avec 'course' comme valeur par défaut
        ALTER TABLE chapters ADD COLUMN content_type TEXT NOT NULL DEFAULT 'course';
        
        -- Ajouter une contrainte pour limiter les valeurs possibles
        ALTER TABLE chapters ADD CONSTRAINT content_type_check 
            CHECK (content_type IN ('course', 'exercise', 'exam'));
            
        -- Commentaire sur la colonne
        COMMENT ON COLUMN chapters.content_type IS 'Type de contenu: cours, exercice ou examen';
    END IF;
END
$$;
