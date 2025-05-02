# HALPI V2 - Documentation

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [Base de données](#base-de-données)
   - [Stockage](#stockage)
3. [Modules fonctionnels](#modules-fonctionnels)
   - [Authentification](#authentification)
   - [Gestion des cours](#gestion-des-cours)
   - [Images interactives](#images-interactives)
   - [Système de prise de notes](#système-de-prise-de-notes)
   - [Parcours d'apprentissage](#parcours-dapprentissage)
   - [Agenda](#agenda)
   - [Accompagnement](#accompagnement)
   - [Support](#support)
   - [Profil utilisateur](#profil-utilisateur)
4. [Diagrammes et schémas](#diagrammes-et-schémas)
   - [Architecture globale](#architecture-globale)
   - [Flux de données](#flux-de-données)
   - [Modèle de données](#modèle-de-données)
5. [Guides de développement](#guides-de-développement)
   - [Installation](#installation)
   - [Contribution](#contribution)
6. [Guide de dépannage](#guide-de-dépannage)
   - [Problèmes courants](#problèmes-courants)
   - [Solutions recommandées](#solutions-recommandées)

## Vue d'ensemble

HALPI V2 est une plateforme d'apprentissage assistée par IA conçue pour aider les étudiants à organiser, comprendre et maîtriser leurs cours. L'application permet aux apprenants de télécharger, organiser et catégoriser différents types de documents (cours, exercices, examens) de manière intuitive et structurée, puis d'interagir avec une IA pour approfondir leur compréhension.

## Architecture technique

### Frontend

L'interface utilisateur de HALPI V2 est développée avec les technologies suivantes :

- **React** : Bibliothèque JavaScript pour la construction d'interfaces utilisateur
- **TypeScript** : Surcouche typée de JavaScript pour améliorer la robustesse du code
- **Tailwind CSS** : Framework CSS utilitaire pour le style
- **Lucide React** : Bibliothèque d'icônes
- **React Router** : Gestion des routes et de la navigation

#### Structure des composants

L'application est organisée selon une architecture modulaire :

- **/components** : Composants réutilisables organisés par domaine fonctionnel
- **/contexts** : Contextes React pour la gestion de l'état global (auth, thème)
- **/pages** : Pages de l'application organisées par domaine fonctionnel
- **/services** : Services pour l'interaction avec les APIs
- **/lib** : Utilitaires et configurations (Supabase, etc.)

### Backend

Le backend de HALPI V2 est construit avec :

- **FastAPI** : Framework Python pour la création d'APIs performantes
- **Supabase** : Plateforme Backend-as-a-Service pour l'authentification, la base de données et le stockage
- **Python** : Langage de programmation principal pour les services backend

#### Services principaux

- **Extraction de contenu** : Extraction du texte et des images des documents PDF, DOCX, PPTX
- **Analyse IA** : Traitement et analyse des contenus pédagogiques
- **Gestion des fichiers** : Upload, conversion et manipulation des fichiers

### Base de données

HALPI V2 utilise PostgreSQL via Supabase avec les tables principales suivantes :

- **users** : Informations des utilisateurs
- **courses** : Informations générales sur les cours
- **user_courses** : Association entre utilisateurs et cours avec préférences
- **chapters** : Chapitres des cours avec métadonnées et contenu extrait
- **activities** : Activités d'apprentissage liées aux cours
- **activity_concepts** : Concepts clés créés par les utilisateurs dans l'activité d'élaboration
- **activity_memorization_progress** : Progression des utilisateurs dans les activités de mémorisation
- **activity_concept_restitution** : Résultats d'évaluation des restitutions de concepts par l'IA

#### Structure des tables pour l'activité de concepts clés

##### Table `activity_concepts`

```sql
CREATE TABLE activity_concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concepts JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);
```

- Stocke les concepts créés par l'utilisateur dans l'activité d'élaboration
- Chaque concept contient des champs structurés (what, why, how, who, when, where, essentials)
- Support pour les champs personnalisés via un tableau JSON
- Support pour les schémas interactifs avec zones cliquables

##### Table `activity_memorization_progress`

```sql
CREATE TABLE activity_memorization_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id TEXT NOT NULL,
  chapter_id TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluated_concepts TEXT[] DEFAULT '{}',
  selected_concept_id TEXT,
  user_score INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);
```

- Suit la progression de l'utilisateur dans les activités de mémorisation
- Stocke les concepts déjà évalués
- Enregistre le concept actuellement sélectionné pour permettre de reprendre l'activité
- Maintient le score global de l'utilisateur

##### Table `activity_concept_restitution`

```sql
CREATE TABLE activity_concept_restitution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_responses JSONB NOT NULL,
  ai_evaluation JSONB,
  note_globale_sur_30 INTEGER,
  est_validee BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id, concept_id)
);
```

- Stocke les réponses de l'utilisateur pour chaque concept dans l'activité de restitution
- Enregistre l'évaluation détaillée fournie par l'IA Fabrile
- Maintient le score global et le statut de validation
- Permet de consulter l'historique des évaluations

### Stockage

Le stockage des fichiers est organisé en plusieurs buckets Supabase pour une séparation claire des responsabilités :

- **Bucket `course-files`** :
  - Stockage des documents bruts (cours, exercices, examens) téléchargés à l'étape 0
  - Les fichiers sont organisés par ID de cours
  - Le type de contenu est déterminé automatiquement en fonction du nom du fichier :
    - Par défaut : `course`
    - Si le nom contient "exercice" ou "exercise" : `exercise`
    - Si le nom contient "exam" : `exam`

- **Bucket `chapters`** :
  - Stockage des chapitres découpés téléchargés à l'étape 1
  - Chaque fichier est associé à une entrée dans la table `chapters`
  - Utilisé pour l'extraction du contenu JSON

- **Bucket `chapters-images`** :
  - Stockage des images extraites des chapitres lors de l'analyse
  - Référencées dans le JSON extrait des chapitres

## Modules fonctionnels

### Authentification

Le module d'authentification gère l'inscription, la connexion et la gestion des sessions utilisateurs :

- **Inscription** : Création de compte avec email et mot de passe
- **Connexion** : Authentification sécurisée via Supabase Auth
- **Récupération de mot de passe** : Processus de réinitialisation par email
- **Gestion de session** : Maintien de la session utilisateur et contrôle d'accès

### Gestion des cours

Le module de gestion des cours permet aux utilisateurs d'organiser leurs matériaux pédagogiques.

#### Types de contenus supportés

- **Cours** : Documents PDF complets qui peuvent être découpés en chapitres
- **Exercices** : Fichiers PDF, DOCX ou PPTX contenant des exercices pratiques
- **Examens** : Fichiers PDF, DOCX ou PPTX d'examens des années précédentes

#### Composants principaux

- **CourseDetailsPage** : Page principale de gestion d'un cours, intégrant les 3 étapes du workflow
- **EditCoursePage** : Page dédiée à l'édition des informations d'un cours existant
- **AddCourseForm** : Formulaire réutilisable pour la création et l'édition des informations d'un cours
- **CourseList** : Affichage de la liste des cours de l'utilisateur sous forme de cartes
- **PdfSplitterMinimal** : Interface simplifiée pour l'upload des chapitres, avec redirection vers SmallPDF

#### Workflow en 3 étapes

##### Étape 0 : Téléchargement des documents

Cette étape permet à l'apprenant de choisir le type de contenu à télécharger via une interface à onglets :

- **Onglet Cours** : Pour télécharger le document PDF complet du cours
- **Onglet Exercices** : Pour télécharger des fichiers d'exercices pratiques
- **Onglet Examens** : Pour télécharger des examens des années précédentes

Chaque onglet présente :
- Des instructions spécifiques au type de contenu
- Une zone de téléchargement adaptée
- La possibilité de télécharger plusieurs fichiers (pour les exercices et examens)

Les fichiers sont stockés dans le bucket Supabase `course-files`.

##### Étape 1 : Découpage en chapitres

Cette étape n'est pertinente que pour les documents de cours et permet :

- De découper le PDF du cours en chapitres distincts
- D'utiliser un service externe (SmallPDF) pour faciliter le découpage
- D'importer des chapitres individuels (fichiers PDF, dossier, ou archive ZIP)

Les fichiers sont stockés dans le bucket Supabase `chapters` et une entrée est créée dans la table `chapters`.

##### Étape 2 : Liste des chapitres

Cette étape affiche tous les chapitres du cours avec :

- Une numérotation automatique
- La possibilité de marquer des chapitres comme introduction ou conclusion
- Des actions pour chaque chapitre (voir PDF, modifier, supprimer)
- Un bouton pour enregistrer l'ordre des chapitres

Après validation, le contenu des chapitres est extrait (texte, images, titres, paragraphes) et stocké au format JSON pour l'analyse IA.

#### Édition des informations du cours

- L'icône crayon sur la carte du cours dans `CourseList` mène vers la page d'édition
- La page `/courses/edit/:courseId` charge les données actuelles du cours et affiche le formulaire pré-rempli
- Le composant `AddCourseForm` gère à la fois la création et la mise à jour des informations

### Images interactives

La fonctionnalité d'images interactives est un outil pédagogique avancé intégré dans le composant `BoxSection.tsx` de l'application HALPI V2. Elle permet de transformer des images statiques en supports d'apprentissage interactifs, facilitant la mémorisation et la compréhension des concepts visuels.

#### Modes d'interaction

L'outil propose deux modes principaux d'interaction :

##### 1. Mode "Légender une image"

Dans ce mode, l'apprenant doit placer correctement des étiquettes sur des zones prédéfinies de l'image.

**Fonctionnement** :
- Des étiquettes sont présentées à l'apprenant sous forme de liste
- L'apprenant doit faire glisser (drag & drop) chaque étiquette sur la zone correspondante
- Un feedback immédiat est fourni (correct/incorrect)
- Un score final est calculé à la fin de l'exercice

**Exemple d'utilisation** :
- Légender les parties d'une cellule
- Identifier les composants d'un circuit électrique
- Nommer les régions sur une carte

##### 2. Mode "Trouver sur l'image"

Dans ce mode, l'apprenant doit cliquer sur des zones spécifiques de l'image selon une consigne donnée.

**Fonctionnement** :
- Une consigne textuelle est présentée à l'apprenant (ex: "Cliquez sur le noyau de la cellule")
- L'apprenant doit cliquer sur la zone correspondante
- Un feedback immédiat est fourni
- L'exercice progresse avec de nouvelles consignes jusqu'à la fin

#### Composants techniques

L'implémentation technique repose sur plusieurs composants clés :

##### HotspotEditor

Le composant `HotspotEditor` (situé dans `src/components/InteractiveImage/HotspotEditor.tsx`) est l'interface principale permettant de créer et configurer des zones interactives sur une image.

**Fonctionnalités principales** :
- Création de zones interactives (hotspots) de forme circulaire ou rectangulaire
- Attribution d'un titre et d'une description optionnelle à chaque zone
- Numérotation des zones
- Prévisualisation de l'exercice
- Sauvegarde de la configuration

##### InteractiveImage

Le composant `InteractiveImage` (situé dans `src/components/InteractiveImage/InteractiveImage.tsx`) est responsable de l'affichage et de l'interaction avec l'image annotée.

**Options d'affichage des zones** :
- Normal : zones visibles avec bordures
- Masqué : zones complètement cachées
- Flouté : zones visibles mais floues
- Transparent : zones visibles uniquement au survol

### Système de prise de notes

Le système de prise de notes de HALPI V2 est organisé en trois sections distinctes, offrant une approche structurée et flexible pour la prise de notes pendant l'apprentissage.

#### Structure des notes

##### 1. Outline (Plan)

Cette section permet de créer un plan hiérarchique du cours avec une numérotation automatique.

**Caractéristiques** :
- Structure hiérarchique à plusieurs niveaux
- Numérotation automatique (1., 1.1., 1.1.1., etc.)
- Support pour différents types de séquences (1., 2., 3. / A., B., C. / i., ii., iii.)
- Conservation de l'indentation lors des sauts de ligne
- Incrémentation automatique des numéros de liste

##### 2. Boxes (Boîtes)

Cette section permet de créer des boîtes redimensionnables contenant des concepts clés.

**Caractéristiques** :
- Création de boîtes de différentes couleurs
- Redimensionnement et positionnement libre
- Support pour le texte formaté
- Possibilité d'ajouter des liens entre les boîtes
- Organisation spatiale des concepts

##### 3. Questions

Cette section est dédiée aux questions personnelles et aux questions d'examen potentielles.

**Caractéristiques** :
- Distinction entre questions personnelles et questions d'examen
- Possibilité d'ajouter des réponses
- Marquage des questions par niveau de difficulté
- Fonctionnalité de révision spécifique aux questions

#### Persistance des données

Le système de prise de notes utilise une approche de persistance à deux niveaux :

##### 1. Sauvegarde automatique dans le localStorage

**Fonctionnement** :
- Sauvegarde automatique à intervalles réguliers (toutes les 30 secondes)
- Sauvegarde déclenchée lors des modifications importantes
- Sauvegarde lors de la fermeture de la page
- Restauration automatique à la réouverture de la page

##### 2. Enregistrement en base de données Supabase

**Fonctionnement** :
- Bouton dédié "Enregistrer dans le cloud"
- Synchronisation bidirectionnelle (local vers cloud et cloud vers local)
- Gestion des conflits avec option de fusion
- Historique des versions sauvegardées

#### Schéma de la base de données

Le stockage des notes dans Supabase utilise la table `activity_notes` avec une structure JSON organisée en sections (outline, boxes, questions) et métadonnées.

### Parcours d'apprentissage

Le module de parcours d'apprentissage permet aux utilisateurs de suivre leur progression dans les cours :

- **Vue d'ensemble** : Affichage de la progression globale sur tous les cours
- **Détail par cours** : Progression détaillée chapitre par chapitre
- **Activités d'apprentissage** : Exercices, quiz et révisions générés par l'IA

#### Activité de concepts clés

L'activité de concepts clés est une fonctionnalité avancée qui permet aux apprenants de maîtriser les concepts fondamentaux d'un chapitre grâce à un processus structuré en plusieurs étapes :

##### 1. Élaboration des concepts clés

Cette première étape permet à l'apprenant de créer des fiches de concepts structurées :

- Création de fiches de concepts avec des champs prédéfinis (Quoi, Pourquoi, Comment, Qui, Quand, Où)
- Possibilité d'ajouter des champs personnalisés
- Ajout de schémas interactifs avec zones cliquables
- Sauvegarde automatique dans la base de données Supabase (table `activity_concepts`)

##### 2. Identification des concepts clés

La deuxième étape teste la capacité de l'apprenant à reconnaître les concepts qu'il a créés :

- Affichage aléatoire de fragments de concepts
- L'apprenant doit identifier à quel concept appartient chaque fragment
- Calcul automatique de similarité pour évaluer la réponse
- Feedback immédiat et score

##### 3. Restitution des concepts clés

La troisième étape, la plus avancée, évalue la capacité de l'apprenant à restituer de mémoire les concepts :

- L'apprenant doit compléter les champs de chaque concept sans voir l'original
- Évaluation par IA des réponses (via Fabrile)
- Feedback détaillé par champ avec score et commentaires
- Système de secours local (similarité textuelle) en cas d'indisponibilité de l'IA
- Sauvegarde des résultats dans la table `activity_concept_restitution`

#### Intégration de l'IA Fabrile

HALPI V2 intègre l'IA Fabrile pour l'évaluation des réponses des apprenants dans l'activité de restitution des concepts clés :

##### Architecture de l'intégration

- **Service centralisé** : `AIService.ts` gère toutes les interactions avec l'API Fabrile
- **Routes dédiées** : 
  - `fabrileInteraction.ts` pour la gestion des prompts et l'extraction des réponses
  - `thread.ts` pour la gestion des conversations
  - `evaluation.ts` pour l'évaluation des réponses
- **Composants UI** :
  - `AIEvaluationButton.tsx` pour déclencher l'évaluation
  - Affichage du feedback détaillé dans `MemorizationRestitutionStep.tsx`

##### Fonctionnalités d'évaluation IA

- **Évaluation par champ** : Analyse détaillée de chaque réponse avec score sur 10
- **Feedback qualitatif** : Commentaires spécifiques sur les forces et faiblesses de chaque réponse
- **Identification des erreurs** : Catégorisation des types d'erreurs (omission, imprécision, contresens)
- **Score global** : Note globale sur 30 points
- **Validation automatique** : Détermination automatique si le concept est maîtrisé

##### Sécurité et robustesse

- **Authentification sécurisée** : Utilisation de tokens API pour l'accès à Fabrile
- **Gestion des erreurs** : Système de secours local en cas d'échec de l'IA
- **Validation des réponses** : Vérification du format JSON et extraction robuste
- **Isolation des données** : Politiques RLS pour garantir que chaque utilisateur n'accède qu'à ses propres données

### Agenda

Le module d'agenda permet aux utilisateurs de planifier leurs sessions d'étude :

- **Calendrier** : Vue calendrier des sessions d'étude planifiées
- **Planification intelligente** : Suggestions de planification basées sur la charge de travail
- **Rappels** : Notifications pour les sessions d'étude à venir

### Accompagnement

Le module d'accompagnement offre un support personnalisé aux utilisateurs :

- **Chat IA** : Conversation avec l'IA pour poser des questions sur les cours
- **Explications personnalisées** : Génération d'explications adaptées au niveau de l'utilisateur
- **Exercices supplémentaires** : Génération d'exercices pour renforcer la compréhension

### Support

Le module de support permet aux utilisateurs d'obtenir de l'aide :

- **FAQ** : Réponses aux questions fréquentes
- **Contact** : Formulaire de contact pour l'assistance
- **Tutoriels** : Guides d'utilisation de la plateforme

### Profil utilisateur

Le module de profil utilisateur permet aux utilisateurs de gérer leurs informations personnelles :

- **Informations personnelles** : Nom, email, photo de profil
- **Préférences** : Paramètres de notification, thème, langue
- **Statistiques** : Temps d'étude, progression, activités récentes

## Guides de développement

### Installation

#### Prérequis

- Node.js (v16+)
- Python (v3.8+)
- Compte Supabase

#### Installation du frontend

```bash
# Cloner le dépôt
git clone https://github.com/votre-organisation/halpi-v2.git
cd halpi-v2

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# Démarrer le serveur de développement
npm run dev
```

#### Installation du backend

```bash
# Se déplacer dans le dossier backend
cd backend

# Créer un environnement virtuel Python
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate sous Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase

# Démarrer le serveur de développement
uvicorn app.main:app --reload
```

### Contribution

#### Bonnes pratiques

- **Nommage des fichiers** : Inclure des mots-clés comme "exercice" ou "exam" dans le nom des fichiers pour faciliter la catégorisation automatique
- **Organisation du code** : Suivre la structure modulaire existante
- **Tests** : Écrire des tests pour les nouvelles fonctionnalités
- **Documentation** : Mettre à jour la documentation pour refléter les changements

#### Workflow de contribution

1. Créer une branche pour votre fonctionnalité (`feature/nom-de-la-fonctionnalite`)
2. Développer et tester votre fonctionnalité
3. Soumettre une pull request avec une description détaillée
4. Attendre la revue de code et les commentaires
5. Apporter les modifications demandées si nécessaire
6. Fusion de la pull request dans la branche principale

### Notes de développement

#### Corrections techniques importantes

1. **Correction des erreurs d'insertion dans la base de données** :
   - Ajout des champs obligatoires manquants (`image_url` et `level`) dans les requêtes d'insertion et de mise à jour
   - Valeurs par défaut pour les champs obligatoires : `image_url: ''` et `level: 'débutant'`
   - Correction de la valeur `order_index` pour éviter l'erreur 400 (utilisation de l'index du fichier au lieu de `Date.now()` qui générait une valeur trop grande)

2. **Refactoring et nettoyage du code** :
   - Suppression de 7 fichiers obsolètes :
     - `CourseDetailsPage.tsx.bak` - Fichier de sauvegarde
     - `PdfSplitter.tsx` - Ancienne version du composant de découpage PDF
     - `PdfSplitterSimple.tsx` - Version intermédiaire non utilisée
     - `PdfDirectRenderer.tsx` - Composant non utilisé dans l'application
     - `pdfWorkerFix.ts` - Utilitaire non utilisé dans l'application
     - `ChapterOptions.tsx` - Composant non utilisé dans l'application actuelle
     - `PdfSplitterNew.tsx` - Composant uniquement utilisé par ChapterOptions, donc également inutile
   - Conservation uniquement des composants essentiels : `AddCourseForm.tsx`, `CourseList.tsx`, et `PdfSplitterMinimal.tsx`

3. **Séparation stricte des buckets** :
   - Correction du bucket utilisé dans `handleUploadChapterFiles` pour utiliser 'chapters' et non 'course-files'
   - Correction du filtrage dans `fetchUploadedFiles` pour exclure les fichiers déjà présents dans le bucket `chapters`

#### Historique des modifications

- **28 Avril 2025** : Amélioration des activités interactives et de la gestion des feedbacks
  - **Éditeur d'images interactives** :
    - Amélioration du zoom et du pan (Alt+clic ou bouton central de la souris)
    - Optimisation du rendu des zones numérotées (pastilles rouges avec numéros blancs en gras)
    - Correction des problèmes de transparence des images
    - Ajout d'un mode prévisualisation de type flashcard avec consignes et champs de réponse
    - Suppression directe des zones sans confirmation
  
  - **Activité Concepts Clés** :
    - Refonte du design des cartes de concepts (layout à 3 colonnes, badges colorés)
    - Ajout d'un système de sauvegarde des concepts dans la base de données
    - Implémentation d'un bouton d'enregistrement explicite en bas à droite
    - Validation obligatoire avant de pouvoir terminer l'activité
    - Suppression de la confirmation lors de la suppression d'une carte
  
  - **Gestion des feedbacks** :
    - Amélioration de la structure de la base de données pour les feedbacks d'activités
    - Ajout des colonnes `activity_type` et `activity_title` pour une meilleure traçabilité
    - Optimisation des requêtes avec index sur le type d'activité

- **Avril 2025** : Refactoring complet du workflow de gestion des cours
  - Simplification de l'interface d'upload et de découpage
  - Ajout de la page d'édition des cours
  - Correction des erreurs d'insertion dans la base de données
  - Nettoyage des composants obsolètes

### Évolutions futures

- Amélioration de la détection automatique du type de contenu
- Ajout de fonctionnalités de recherche dans les documents
- Support pour d'autres formats de fichiers
- Intégration d'outils d'analyse de progression avancés
- Fonctionnalités collaboratives pour l'étude en groupe

## Intégration de l'IA Fabrile

HALPI V2 intègre l'IA Fabrile pour améliorer l'expérience d'apprentissage, en particulier pour l'évaluation des concepts clés dans l'activité de mémorisation.

### Architecture de l'intégration

L'intégration de Fabrile suit une architecture modulaire et robuste :

#### Services et API

- **AIService.ts** : Service centralisé qui gère toutes les interactions avec l'API Fabrile
  - Méthodes principales : `evaluateConceptRestitution`, `getRecommendations`, `getFeedback`
  - Typage fort des requêtes et réponses
  - Gestion des erreurs et des timeouts

- **Routes dédiées** :
  - `fabrileInteraction.ts` : Gestion des prompts, extraction des réponses JSON, validation
  - `thread.ts` : Création et gestion des threads de conversation
  - `evaluation.ts` : Logique d'évaluation spécifique aux différents types de contenus

#### Composants UI

- **AIEvaluationButton.tsx** : Bouton réutilisable pour déclencher une évaluation IA
- **AIFeedbackDisplay** : Affichage du feedback détaillé par champ avec scores et commentaires
- Intégration dans les composants d'activités :
  - `MemorizationRestitutionStep.tsx` : Évaluation des réponses de restitution
  - `MemorizationIdentificationStep.tsx` : Utilisation de l'algorithme local pour l'identification

### Fonctionnalités d'évaluation IA

#### Évaluation des concepts clés

- **Évaluation par champ** : Analyse détaillée de chaque réponse avec score sur 10
- **Feedback qualitatif** : Commentaires spécifiques sur les forces et faiblesses
- **Identification des erreurs** : Catégorisation des types d'erreurs (omission, imprécision, contresens)
- **Score global** : Note globale sur 30 points
- **Validation automatique** : Détermination automatique si le concept est maîtrisé

#### Robustesse et sécurité

- **Système de secours** : Algorithme local de similarité textuelle en cas d'indisponibilité de l'IA
- **Validation des réponses** : Vérification du format JSON et extraction robuste
- **Gestion des erreurs** : Traitement des erreurs API, timeouts, et réponses mal formatées
- **Isolation des données** : Politiques RLS pour garantir que chaque utilisateur n'accède qu'à ses propres données

### Configuration et variables d'environnement

Pour utiliser l'intégration Fabrile, les variables d'environnement suivantes doivent être configurées dans le fichier `.env` :

```
# Configuration Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon

# Configuration Fabrile
VITE_FABRILE_TOKEN=votre-token-api
VITE_FABRILE_ORG_ID=votre-id-organisation
VITE_FABRILE_API_URL=https://api.fabrile.ai
VITE_Restitution_BOT_ID=id-du-bot-de-restitution
```

### Schéma de la base de données pour l'évaluation IA

```sql
CREATE TABLE activity_concept_restitution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_responses JSONB NOT NULL,
  ai_evaluation JSONB,
  note_globale_sur_30 INTEGER,
  est_validee BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id, concept_id)
);

-- Politiques RLS pour la sécurité
CREATE POLICY "Users can only view their own restitution results"
  ON activity_concept_restitution
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own restitution results"
  ON activity_concept_restitution
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own restitution results"
  ON activity_concept_restitution
  FOR UPDATE
  USING (auth.uid() = user_id);
```

### Performances et optimisations

- **Mise en cache** : Les évaluations sont mises en cache pour éviter des appels API redondants
- **Traitement asynchrone** : Les appels à l'IA sont effectués de manière asynchrone pour ne pas bloquer l'interface
- **Pré-calcul** : Certaines métriques sont pré-calculées pour améliorer les performances d'affichage
- **Lazy loading** : Les résultats d'évaluation sont chargés à la demande

### Évolutions futures de l'intégration IA

- Intégration de l'IA pour la génération automatique de concepts clés à partir du contenu du cours
- Recommandations personnalisées basées sur les performances de l'apprenant
- Analyse des tendances d'apprentissage sur plusieurs activités
- Support multilingue pour l'évaluation des concepts
- Génération automatique d'exercices complémentaires pour renforcer les concepts mal maîtrisés
