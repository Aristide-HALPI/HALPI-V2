# Documentation HALPI V2

Ce document contient toutes les informations essentielles sur la structure, la base de données, le backend et les fonctionnalités de l'application HALPI V2.

## Table des matières

1. [Structure de l'application](#structure-de-lapplication)
2. [Base de données Supabase](#base-de-données-supabase)
3. [Stockage Supabase](#stockage-supabase)
4. [Authentification](#authentification)
5. [Fonctionnalités principales](#fonctionnalités-principales)
6. [Composants clés](#composants-clés)
7. [Dépendances](#dépendances)

## Structure de l'application

HALPI V2 est une application React utilisant TypeScript. Voici sa structure principale :

```
HALPI V2/
├── src/
│   ├── components/
│   │   ├── common/        # Composants réutilisables (Button, Card, etc.)
│   │   ├── Courses/       # Composants liés aux cours
│   │   ├── Profile/       # Composants liés au profil utilisateur
│   │   └── ...
│   ├── pages/
│   │   ├── courses/       # Pages liées aux cours
│   │   ├── auth/          # Pages d'authentification
│   │   └── ...
│   ├── lib/
│   │   └── supabaseClient.ts  # Configuration de Supabase
│   ├── App.tsx           # Point d'entrée avec les routes
│   └── ...
├── migrations/           # Scripts SQL pour les migrations Supabase
├── public/               # Ressources statiques
└── ...
```

## Base de données Supabase

### Tables principales

1. **user_profiles**
   - `id` (UUID, clé primaire) - Lié à auth.users
   - `first_name` (text)
   - `last_name` (text)
   - `email` (text)
   - `avatar_url` (text, nullable)
   - `created_at` (timestamp with time zone)

2. **courses**
   - `id` (UUID, clé primaire)
   - `title` (text)
   - `description` (text)
   - `image_url` (text, nullable)
   - `created_at` (timestamp with time zone)
   - `created_by` (UUID, foreign key → user_profiles.id)

3. **user_courses**
   - `id` (UUID, clé primaire)
   - `user_id` (UUID, foreign key → user_profiles.id)
   - `course_id` (UUID, foreign key → courses.id)
   - `start_date` (date, nullable)
   - `end_date` (date, nullable)
   - `difficulty` (integer, 1-5)
   - `estimated_time` (integer, en heures)
   - `importance` (integer, 1-5)
   - `created_at` (timestamp with time zone)

4. **chapters**
   - `id` (UUID, clé primaire)
   - `course_id` (UUID, foreign key → courses.id)
   - `title` (text)
   - `description` (text, nullable)
   - `order_index` (integer)
   - `source_url` (text) - URL du fichier PDF/PowerPoint/Word
   - `chapter_type` (text, default: 'savoir') - Type du chapitre
   - `created_at` (timestamp with time zone)

### Politiques RLS (Row Level Security)

Des politiques RLS sont configurées sur les tables pour garantir que les utilisateurs ne peuvent accéder qu'à leurs propres données ou aux données partagées avec eux.

Exemple pour `user_courses` :
```sql
CREATE POLICY "Users can insert their own user_courses"
ON "public"."user_courses"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own user_courses"
ON "public"."user_courses"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

## Stockage Supabase

### Buckets configurés

1. **chapters**
   - Contient les fichiers PDF découpés et les fichiers PowerPoint/Word importés comme chapitres
   - Accès public pour permettre l'affichage des documents
   - Types MIME autorisés : PDF, PowerPoint, Word

2. **course-files**
   - Contient les fichiers PDF principaux des cours
   - Accès public
   - Types MIME autorisés : PDF, PowerPoint, Word

### Utilisation dans le code

```typescript
// Upload d'un fichier dans le bucket 'chapters'
const { error } = await supabase.storage
  .from('chapters')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: true
  });

// Récupération de l'URL publique
const { data } = supabase.storage
  .from('chapters')
  .getPublicUrl(filePath);
```

## Authentification

HALPI V2 utilise le système d'authentification de Supabase avec email/mot de passe.

```typescript
// Inscription
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

// Connexion
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Déconnexion
await supabase.auth.signOut();
```

Après l'inscription, un profil utilisateur est créé dans la table `user_profiles`.

## Fonctionnalités principales

### 1. Gestion des cours

- Création de cours avec titre, description, image, difficulté, temps estimé et importance
- Affichage des cours sous forme de cartes avec notification visuelle pour les cours sans chapitres
- Sélection automatique d'images libres de droits cohérentes avec le titre du cours

### 2. Découpage de syllabus PDF

- Téléchargement de fichiers PDF, PowerPoint et Word
- Découpage des PDF en chapitres via l'interface intégrée
- Importation directe des fichiers PowerPoint et Word comme chapitres uniques
- Stockage des fichiers dans Supabase Storage
- Création automatique des chapitres dans la base de données

### 3. Gestion des chapitres

- Réorganisation des chapitres par glisser-déposer
- Édition des titres et descriptions
- Suppression de chapitres

## Composants clés

### PdfSplitter

Composant principal pour le découpage des PDF et l'importation des fichiers PowerPoint/Word.

```typescript
<PdfSplitter
  courseId={courseId}
  onSplitComplete={(chapterCount) => {
    fetchChapters();
    setShowPdfSplitter(false);
  }}
  onCancel={() => setShowPdfSplitter(false)}
/>
```

Fonctionnalités :
- Prévisualisation des PDF avec navigation par page
- Ajout/suppression de points de découpage
- Aperçu des chapitres qui seront créés
- Téléchargement et découpage automatique

### CourseList

Affiche la liste des cours de l'utilisateur avec des cartes interactives.

```typescript
<CourseList courses={courses} />
```

### AddCourseForm

Formulaire de création de cours avec validation et feedback utilisateur.

```typescript
<AddCourseForm onCourseAdded={handleCourseAdded} />
```

## Dépendances

### Principales bibliothèques

- **React** - Framework UI
- **TypeScript** - Typage statique
- **Supabase** - Backend as a Service (BaaS)
- **react-pdf** - Visualisation des PDF
- **pdf-lib** - Manipulation et découpage des PDF
- **lucide-react** - Icônes
- **tailwindcss** - Framework CSS

### Installation

```bash
npm install
```

### Configuration

Créer un fichier `.env` à la racine du projet avec les variables suivantes :

```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

## Développement futur

- Création de buckets dédiés dans Supabase pour plus de clarté et de sécurité
- Gestion avancée des erreurs côté upload
- Modification des titres/descriptions des chapitres générés automatiquement
- Optimisation pour les très gros fichiers PDF
