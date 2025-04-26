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
   - [Parcours d'apprentissage](#parcours-dapprentissage)
   - [Agenda](#agenda)
   - [Accompagnement](#accompagnement)
   - [Support](#support)
   - [Profil utilisateur](#profil-utilisateur)
4. [Guides de développement](#guides-de-développement)
   - [Installation](#installation)
   - [Contribution](#contribution)

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

### Parcours d'apprentissage

Le module de parcours d'apprentissage permet aux utilisateurs de suivre leur progression dans les cours :

- **Vue d'ensemble** : Affichage de la progression globale sur tous les cours
- **Détail par cours** : Progression détaillée chapitre par chapitre
- **Activités d'apprentissage** : Exercices, quiz et révisions générés par l'IA

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
