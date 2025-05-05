# HALPI V2 - Documentation Enrichie

Cette documentation complémentaire vient enrichir le README principal avec des informations détaillées sur des fonctionnalités clés de HALPI V2.

## Table des matières

1. [Images interactives](#images-interactives)
   - [Présentation générale](#présentation-générale)
   - [Modes d'interaction](#modes-dinteraction)
   - [Composants techniques](#composants-techniques)
   - [Guide d'utilisation](#guide-dutilisation)
2. [Système de prise de notes](#système-de-prise-de-notes)
   - [Structure des notes](#structure-des-notes)
   - [Persistance des données](#persistance-des-données)
   - [Fonctionnalités d'édition avancées](#fonctionnalités-dédition-avancées)
   - [Schéma de la base de données](#schéma-de-la-base-de-données)
3. [Activité de mindmapping](#activité-de-mindmapping)
   - [Présentation générale](#présentation-générale-mindmapping)
   - [Structure des composants](#structure-des-composants)
   - [Visualisation radiale](#visualisation-radiale)
   - [Persistance des données](#persistance-des-données-mindmapping)
   - [Intégration IA](#intégration-ia-mindmapping)
4. [Services IA et API](#services-ia-et-api)
   - [Architecture des services](#architecture-des-services)
   - [Endpoints API](#endpoints-api)
   - [Intégration avec les activités](#intégration-avec-les-activités)
5. [Diagrammes et schémas](#diagrammes-et-schémas)
   - [Architecture globale](#architecture-globale)
   - [Flux de données](#flux-de-données)
   - [Modèle de données](#modèle-de-données)
6. [Guide de dépannage](#guide-de-dépannage)
   - [Problèmes courants](#problèmes-courants)
   - [Solutions recommandées](#solutions-recommandées)

## Images interactives

### Présentation générale

La fonctionnalité d'images interactives est un outil pédagogique avancé intégré dans le composant `BoxSection.tsx` de l'application HALPI V2. Elle permet de transformer des images statiques en supports d'apprentissage interactifs, facilitant la mémorisation et la compréhension des concepts visuels.

Cette fonctionnalité est particulièrement utile pour :
- Les schémas anatomiques
- Les diagrammes scientifiques
- Les cartes géographiques
- Les illustrations techniques
- Les graphiques complexes

### Modes d'interaction

L'outil propose deux modes principaux d'interaction :

#### 1. Mode "Légender une image"

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

#### 2. Mode "Trouver sur l'image"

Dans ce mode, l'apprenant doit cliquer sur des zones spécifiques de l'image selon une consigne donnée.

**Fonctionnement** :
- Une consigne textuelle est présentée à l'apprenant (ex: "Cliquez sur le noyau de la cellule")
- L'apprenant doit cliquer sur la zone correspondante
- Un feedback immédiat est fourni
- L'exercice progresse avec de nouvelles consignes jusqu'à la fin

**Exemple d'utilisation** :
- Identifier des structures anatomiques
- Localiser des éléments sur une carte
- Repérer des anomalies sur une image médicale

### Composants techniques

L'implémentation technique repose sur plusieurs composants clés :

#### HotspotEditor

Le composant `HotspotEditor` (situé dans `src/components/InteractiveImage/HotspotEditor.tsx`) est l'interface principale permettant de créer et configurer des zones interactives sur une image.

**Fonctionnalités principales** :
- Création de zones interactives (hotspots) de forme circulaire ou rectangulaire
- Attribution d'un titre et d'une description optionnelle à chaque zone
- Numérotation des zones
- Prévisualisation de l'exercice
- Sauvegarde de la configuration

#### InteractiveImage

Le composant `InteractiveImage` (situé dans `src/components/InteractiveImage/InteractiveImage.tsx`) est responsable de l'affichage et de l'interaction avec l'image annotée.

**Modes de fonctionnement** :
- Mode édition : pour créer et modifier les zones
- Mode prévisualisation : pour tester l'exercice
- Mode exercice : pour l'apprenant qui réalise l'activité

**Options d'affichage des zones** :
- Normal : zones visibles avec bordures
- Masqué : zones complètement cachées
- Flouté : zones visibles mais floues
- Transparent : zones visibles uniquement au survol

#### Structure des données

Les hotspots sont définis par la structure suivante :

```typescript
interface Hotspot {
  id: string;
  shape: 'circle' | 'rect';
  coords: {
    x: number;
    y: number;
    w?: number;
    h?: number;
    r?: number;
  };
  title: string;
  description?: string;
  number?: number | null;
  display?: 'normal' | 'masked' | 'blurred' | 'transparent';
}
```

### Guide d'utilisation

#### Pour les créateurs de contenu

1. **Création d'un exercice interactif** :
   - Téléchargez une image (schéma, diagramme, etc.)
   - Ouvrez l'éditeur d'images interactives
   - Choisissez le mode d'exercice (légender ou trouver)
   - Créez des zones interactives sur l'image
   - Attribuez un titre et une description à chaque zone
   - Prévisualisez l'exercice
   - Sauvegardez la configuration

2. **Bonnes pratiques** :
   - Utilisez des images de haute qualité
   - Créez des zones de taille suffisante pour être facilement cliquables
   - Fournissez des descriptions claires et précises
   - Testez l'exercice avant de le publier
   - Limitez le nombre de zones à 10 maximum pour éviter la surcharge cognitive

#### Pour les apprenants

1. **Mode "Légender une image"** :
   - Lisez attentivement les étiquettes disponibles
   - Faites glisser chaque étiquette sur la zone correspondante
   - Une étiquette correctement placée sera validée automatiquement
   - Continuez jusqu'à ce que toutes les étiquettes soient placées

2. **Mode "Trouver sur l'image"** :
   - Lisez attentivement la consigne
   - Cliquez sur la zone correspondante
   - Un feedback immédiat vous indiquera si votre choix est correct
   - Passez à la consigne suivante

## Système de prise de notes

### Structure des notes

Le système de prise de notes de HALPI V2 est organisé en trois sections distinctes, offrant une approche structurée et flexible pour la prise de notes pendant l'apprentissage :

#### 1. Outline (Plan)

Cette section permet de créer un plan hiérarchique du cours avec une numérotation automatique.

**Caractéristiques** :
- Structure hiérarchique à plusieurs niveaux
- Numérotation automatique (1., 1.1., 1.1.1., etc.)
- Support pour différents types de séquences (1., 2., 3. / A., B., C. / i., ii., iii.)
- Conservation de l'indentation lors des sauts de ligne
- Incrémentation automatique des numéros de liste

**Exemple d'utilisation** :
```
1. Introduction à la psychologie
   1.1. Définition et champ d'étude
   1.2. Histoire de la psychologie
      1.2.1. Structuralisme
      1.2.2. Fonctionnalisme
      1.2.3. Behaviorisme
   1.3. Méthodes de recherche
2. Bases biologiques du comportement
   2.1. Le système nerveux
   2.2. Le cerveau
```

#### 2. Boxes (Boîtes)

Cette section permet de créer des boîtes redimensionnables contenant des concepts clés.

**Caractéristiques** :
- Création de boîtes de différentes couleurs
- Redimensionnement et positionnement libre
- Support pour le texte formaté
- Possibilité d'ajouter des liens entre les boîtes
- Organisation spatiale des concepts

**Exemple d'utilisation** :
- Carte mentale des concepts clés
- Regroupement visuel d'informations connexes
- Mise en évidence des définitions importantes

#### 3. Questions

Cette section est dédiée aux questions personnelles et aux questions d'examen potentielles.

**Caractéristiques** :
- Distinction entre questions personnelles et questions d'examen
- Possibilité d'ajouter des réponses
- Marquage des questions par niveau de difficulté
- Fonctionnalité de révision spécifique aux questions

**Exemple d'utilisation** :
- Questions de compréhension personnelles
- Questions d'examen des années précédentes
- Points à éclaircir avec l'enseignant

### Persistance des données

Le système de prise de notes de HALPI V2 utilise une approche de persistance à deux niveaux pour garantir que les notes de l'apprenant ne sont jamais perdues :

#### 1. Sauvegarde automatique dans le localStorage

**Fonctionnement** :
- Sauvegarde automatique à intervalles réguliers (toutes les 30 secondes)
- Sauvegarde déclenchée lors des modifications importantes
- Sauvegarde lors de la fermeture de la page
- Restauration automatique à la réouverture de la page

**Avantages** :
- Aucune action requise de la part de l'utilisateur
- Protection contre les pertes de données en cas de fermeture accidentelle
- Fonctionnement hors ligne
- Performances optimales (pas de latence réseau)

#### 2. Enregistrement en base de données Supabase

**Fonctionnement** :
- Bouton dédié "Enregistrer dans le cloud"
- Synchronisation bidirectionnelle (local vers cloud et cloud vers local)
- Gestion des conflits avec option de fusion
- Historique des versions sauvegardées

**Avantages** :
- Accès aux notes depuis n'importe quel appareil
- Sauvegarde sécurisée à long terme
- Possibilité de restaurer des versions antérieures
- Partage potentiel avec d'autres utilisateurs (fonctionnalité future)

### Fonctionnalités d'édition avancées

Le système de prise de notes de HALPI V2 intègre plusieurs fonctionnalités avancées pour faciliter la prise de notes structurées :

#### Génération intelligente de séquences

**Fonctionnement** :
- Détection automatique du type de séquence (numérique, alphabétique, romaine)
- Suggestion de continuation de séquence
- Support pour les séquences imbriquées
- Possibilité de changer le type de séquence à la volée

**Types de séquences supportés** :
- Numérique : 1., 2., 3., ...
- Alphabétique majuscule : A., B., C., ...
- Alphabétique minuscule : a., b., c., ...
- Romaine minuscule : i., ii., iii., ...
- Romaine majuscule : I., II., III., ...
- Puces : •, ◦, ▪, ...

#### Conservation de l'indentation

**Fonctionnement** :
- Préservation automatique de l'indentation lors d'un saut de ligne
- Détection intelligente du niveau hiérarchique
- Raccourcis clavier pour augmenter/diminuer l'indentation (Tab/Shift+Tab)
- Support pour les espaces et les tabulations

#### Incrémentation automatique des numéros de liste

**Fonctionnement** :
- Détection du dernier numéro de liste utilisé
- Incrémentation automatique lors de la création d'un nouvel élément
- Gestion correcte des séquences interrompues
- Réorganisation automatique lors du déplacement d'éléments

### Schéma de la base de données

Le stockage des notes dans Supabase utilise la table `activity_notes` avec la structure suivante :

```sql
CREATE TABLE activity_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_activity UNIQUE (user_id, activity_id)
);

-- Politiques RLS pour la sécurité
CREATE POLICY "Les utilisateurs peuvent lire leurs propres notes"
  ON activity_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres notes"
  ON activity_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres notes"
  ON activity_notes FOR UPDATE
  USING (auth.uid() = user_id);
```

La structure JSON pour le stockage des données est organisée comme suit :

```json
{
  "outline": {
    "items": [
      {
        "id": "o1",
        "text": "Introduction",
        "level": 1,
        "type": "numeric",
        "children": [
          {
            "id": "o1.1",
            "text": "Définition",
            "level": 2,
            "type": "numeric"
          }
        ]
      }
    ]
  },
  "boxes": {
    "items": [
      {
        "id": "b1",
        "title": "Concept clé",
        "content": "Description du concept",
        "position": { "x": 100, "y": 150 },
        "size": { "width": 200, "height": 150 },
        "color": "blue"
      }
    ]
  },
  "questions": {
    "items": [
      {
        "id": "q1",
        "text": "Question importante ?",
        "type": "personal",
        "answer": "Réponse à la question",
        "difficulty": "medium"
      }
    ]
  },
  "metadata": {
    "lastSaved": "2025-04-28T14:30:00Z",
    "version": "1.2"
  }
}
```

## Diagrammes et schémas

### Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        HALPI V2 Platform                         │
├─────────────┬─────────────────────────────┬─────────────────────┤
│             │                             │                     │
│  Frontend   │          Backend            │      Database       │
│  (React)    │         (FastAPI)           │     (Supabase)      │
│             │                             │                     │
├─────────────┼─────────────────────────────┼─────────────────────┤
│ - UI        │ - API Endpoints             │ - Authentication    │
│ - State     │ - Business Logic            │ - Data Storage      │
│ - Routing   │ - File Processing           │ - File Storage      │
│ - Components│ - AI Integration            │ - RLS Policies      │
└─────────────┴─────────────────────────────┴─────────────────────┘
```

### Flux de données

```
┌──────────┐    ┌────────────┐    ┌────────────┐    ┌─────────────┐
│          │    │            │    │            │    │             │
│  Upload  ├───►│  Storage   ├───►│ Processing ├───►│  Database   │
│          │    │            │    │            │    │             │
└──────────┘    └────────────┘    └────────────┘    └─────────────┘
      │                                                    │
      │                                                    │
      ▼                                                    ▼
┌──────────┐                                       ┌─────────────┐
│          │                                       │             │
│   UI     │◄──────────────────────────────────────┤  Retrieval  │
│          │                                       │             │
└──────────┘                                       └─────────────┘
```

### Modèle de données

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│  courses   │     │  chapters  │     │  users     │
├────────────┤     ├────────────┤     ├────────────┤
│ id         │◄────┤ course_id  │     │ id         │
│ title      │     │ title      │     │ email      │
│ description│     │ content    │     │ created_at │
│ image_url  │     │ pdf_url    │     └────────────┘
│ level      │     │ order_index│           ▲
│ created_by │─────┤ created_by │           │
└────────────┘     └────────────┘           │
                         ▼                  │
┌────────────┐     ┌────────────┐          │
│ activities │     │ user_notes │          │
├────────────┤     ├────────────┤          │
│ id         │     │ id         │          │
│ title      │     │ user_id    │          │
│ type       │     │ activity_id│◄─────────┘
│ course_id  │◄────┤ chapter_id │
│ chapter_id │     │ content    │
└────────────┘     │ updated_at │
                   └────────────┘
                         ▲
                         │
┌──────────────────────┐ │ ┌──────────────────────┐
│activity_memorization_│ │ │activity_mindmapping_ │
│     progress         │ │ │     progress         │
├──────────────────────┤ │ ├──────────────────────┤
│id                    │ │ │id                    │
│activity_id           │─┘ │activity_id           │
│user_id               │   │user_id               │
│found_concepts        │   │central_topic         │
│current_concept_index │   │branches              │
│is_complete           │   │created_at            │
│updated_at            │   │updated_at            │
└──────────────────────┘   └──────────────────────┘
```

## Activité de mindmapping

### Présentation générale {#présentation-générale-mindmapping}

L'activité de mindmapping (carte mentale) est un outil pédagogique avancé intégré dans HALPI V2 qui permet aux apprenants de structurer visuellement leurs connaissances autour d'un sujet central. Cette activité suit une approche pédagogique en plusieurs étapes, allant de la sensibilisation à la création numérique interactive.

Cette fonctionnalité est particulièrement utile pour :
- Organiser et hiérarchiser les idées
- Établir des connexions entre différents concepts
- Faciliter la mémorisation par la visualisation
- Développer la pensée créative et non-linéaire
- Synthétiser des informations complexes

### Structure des composants

L'activité de mindmapping est organisée en quatre étapes distinctes, chacune gérée par un composant spécifique :

#### 1. MindmappingActivity.tsx

Composant principal qui orchestre le flux entre les différentes étapes de l'activité :

```typescript
enum MindmappingStep {
  INTRODUCTION = 'introduction',
  MANUAL = 'manual',
  DIGITAL = 'digital',
  CONCLUSION = 'conclusion'
}
```

Ce composant gère la navigation entre les étapes et maintient l'état global de l'activité.

#### 2. MindmappingIntroStep.tsx

Étape d'introduction qui présente le concept de carte mentale et ses bénéfices pédagogiques :

- Explication du principe de la carte mentale
- Présentation des objectifs de l'activité
- Instructions pour les étapes suivantes

#### 3. MindmappingManualStep.tsx

Étape de création manuelle où l'apprenant est encouragé à dessiner sa carte mentale sur papier :

- Guide pour la création d'une carte mentale manuscrite
- Conseils pratiques et méthodologiques
- Option pour télécharger et imprimer un modèle vierge

#### 4. MindmappingDigitalStep.tsx

Étape de création numérique interactive avec un formulaire dynamique et une visualisation en temps réel :

- Formulaire pour définir le sujet central
- Interface pour ajouter/modifier/supprimer des branches principales
- Gestion des sous-branches avec détails explicatifs
- Visualisation radiale interactive qui se met à jour en temps réel
- Sauvegarde automatique de la progression
- Évaluation IA du travail réalisé

### Visualisation radiale

La visualisation de la carte mentale dans l'étape numérique utilise une approche radiale professionnelle :

#### Caractéristiques visuelles

- **Sujet central** : Affiché au centre dans un rectangle arrondi avec bordure bleue
- **Branches principales** : Disposées autour du sujet central avec des formes distinctives
  - Formes variées : hexagones, cercles, rectangles selon le type de branche
  - Couleurs uniques pour chaque branche principale
- **Sous-branches** : Affichées avec une version plus claire de la couleur de leur branche parente
  - Bordure colorée sur le côté pour indiquer la relation avec la branche parente
  - Affichage du titre et des détails dans un format lisible

#### Organisation spatiale

- **Disposition intelligente** qui s'adapte au nombre de branches :
  - Pour 1-4 branches : disposition aux 4 points cardinaux (haut, droite, bas, gauche)
  - Pour 5+ branches : disposition circulaire autour du centre
- **Connexions visuelles** : Lignes SVG reliant le sujet central à chaque branche
- **Positionnement des sous-branches** : Alignement automatique à gauche ou à droite selon leur position

#### Implémentation technique

```tsx
// Exemple de code pour la création d'une forme hexagonale
<div className="hexagon shadow-lg p-3 text-center font-bold"
  style={{
    backgroundColor: style.color,
    color: 'white',
    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
  }}>
  {branch.title || "Branche sans titre"}
</div>
```

### Persistance des données {#persistance-des-données-mindmapping}

#### Schéma de la base de données

La progression de l'activité de mindmapping est sauvegardée dans la table `activity_mindmapping_progress` :

```sql
CREATE TABLE activity_mindmapping_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  central_topic TEXT,
  branches JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_activity UNIQUE (user_id, activity_id)
);

-- Politiques RLS pour la sécurité
CREATE POLICY "Les utilisateurs peuvent lire leur propre progression de mindmapping"
  ON activity_mindmapping_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leur propre progression de mindmapping"
  ON activity_mindmapping_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre progression de mindmapping"
  ON activity_mindmapping_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

#### Structure des données JSON

Les branches et sous-branches sont stockées au format JSON dans le champ `branches` :

```json
{
  "branches": [
    {
      "id": "branch-1",
      "title": "Concept principal",
      "subBranches": [
        {
          "id": "sub-1",
          "title": "Sous-concept",
          "details": "Explication détaillée du sous-concept"
        }
      ]
    }
  ]
}
```

### Intégration IA {#intégration-ia-mindmapping}

L'activité de mindmapping intègre une évaluation IA qui analyse la structure et le contenu de la carte mentale :

- **Évaluation de la structure** : Analyse de l'organisation hiérarchique et des relations entre les concepts
- **Évaluation du contenu** : Analyse de la pertinence et de la complétude des informations
- **Feedback personnalisé** : Suggestions d'amélioration et points forts identifiés

L'intégration utilise le service `AIService` pour communiquer avec l'API Fabrile.

## Services IA et API

### Architecture des services

Les services IA de HALPI V2 sont organisés selon une architecture modulaire :

#### Structure des dossiers

```
src/
├── api/
│   └── ai/
│       └── routes/
│           ├── fabrileInteraction.ts
│           └── thread.ts
└── services/
    └── ai/
        └── AIService.ts
```

#### Composants principaux

1. **AIService.ts** : Service principal qui expose des méthodes de haut niveau pour interagir avec l'IA

```typescript
class AIService {
  // Évaluation des concepts restitués
  static async evaluateConceptRestitution(userResponses, referenceConcept);
  
  // Évaluation de la carte mentale
  static async evaluateMindmap(centralTopic, branches);
  
  // Autres méthodes d'évaluation...
}
```

2. **fabrileInteraction.ts** : Gestion des interactions avec l'API Fabrile

```typescript
// Création d'une nouvelle interaction avec Fabrile
export async function createFabrileInteraction(botId, content, userId);

// Récupération des réponses de Fabrile
export async function getFabrileResponse(interactionId);
```

3. **thread.ts** : Gestion des threads de conversation pour les interactions continues

```typescript
// Création d'un nouveau thread
export async function createThread(userId, contextData);

// Ajout d'un message à un thread existant
export async function addMessageToThread(threadId, content, role);
```

### Endpoints API

Les endpoints API pour l'IA sont structurés comme suit :

#### Évaluation des concepts

- **POST /api/ai/evaluate-concept**
  - Évalue la restitution d'un concept par rapport à une référence
  - Retourne un score et un feedback détaillé

#### Évaluation des cartes mentales

- **POST /api/ai/evaluate-mindmap**
  - Évalue la structure et le contenu d'une carte mentale
  - Retourne des suggestions d'amélioration et une analyse qualitative

### Intégration avec les activités

Les services IA sont intégrés avec plusieurs activités pédagogiques :

1. **Mémorisation (MemorizationRestitutionStep)**
   - Évaluation des réponses de restitution des concepts
   - Feedback détaillé par champ avec score et commentaires
   - Système de secours local en cas d'indisponibilité de l'IA

2. **Mindmapping (MindmappingDigitalStep)**
   - Analyse de la structure de la carte mentale
   - Évaluation de la pertinence des branches et sous-branches
   - Suggestions d'amélioration personnalisées

3. **Composant AIEvaluationButton**
   - Bouton réutilisable pour déclencher une évaluation IA
   - Gestion des états de chargement et d'erreur
   - Affichage du feedback dans une interface utilisateur cohérente

## Guide de dépannage

### Problèmes courants

#### 1. Problèmes d'affichage des PDF

**Symptômes** :
- PDF non visible dans l'interface
- Message d'erreur "The API version does not match the Worker version"
- Chargement infini du PDF

**Causes possibles** :
- Incompatibilité entre react-pdf et le worker PDF.js
- URL incorrecte pour le worker PDF.js
- Problèmes CORS lors du chargement du worker depuis un CDN

**Solutions** :
- Utiliser la version correcte du worker PDF.js (4.8.69 pour react-pdf 9.2.1)
- Configurer correctement l'URL du worker :
  ```typescript
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js';
  ```
- Utiliser une URL HTTPS pour éviter les problèmes de sécurité
- En dernier recours, désactiver le worker en définissant une URL vide :
  ```typescript
  pdfjs.GlobalWorkerOptions.workerSrc = '';
  ```

#### 2. Erreurs d'insertion dans la base de données

**Symptômes** :
- Message d'erreur "new row violates row-level security policy"
- Erreur 400 lors de l'upload de fichiers
- Échec de l'enregistrement des données

**Causes possibles** :
- Politiques RLS (Row Level Security) bloquant l'insertion
- Champs obligatoires manquants (image_url, level)
- Valeur trop grande pour order_index

**Solutions** :
- Vérifier que l'utilisateur est correctement authentifié
- Ajouter des valeurs par défaut pour les champs obligatoires :
  ```typescript
  const courseData = {
    title: courseTitle,
    description: courseDescription,
    image_url: imageUrl || '', // Valeur par défaut
    level: courseLevel || 'débutant', // Valeur par défaut
    created_by: user.id
  };
  ```
- Utiliser l'index du fichier au lieu de `Date.now()` pour order_index

#### 3. Problèmes de stockage des fichiers

**Symptômes** :
- Fichiers non visibles après upload
- Erreur lors de l'upload
- Fichiers uploadés dans le mauvais bucket

**Causes possibles** :
- Confusion entre les buckets (course-files, chapters, chapters-images)
- Permissions insuffisantes sur les buckets
- Noms de fichiers incorrects

**Solutions** :
- Vérifier le bucket utilisé dans les fonctions d'upload :
  ```typescript
  // Pour les fichiers de cours
  const { data, error } = await supabase.storage
    .from('course-files')
    .upload(`${courseId}/${file.name}`, file);
    
  // Pour les chapitres
  const { data, error } = await supabase.storage
    .from('chapters')
    .upload(`${courseId}/${chapterIndex}_${file.name}`, file);
  ```
- S'assurer que les politiques de stockage permettent l'upload par l'utilisateur
- Utiliser des noms de fichiers uniques pour éviter les conflits

### Solutions recommandées

#### Optimisation des performances

1. **Chargement des PDF** :
   - Précharger les PDF en arrière-plan
   - Utiliser une version mise en cache du worker PDF.js
   - Limiter le nombre de pages affichées simultanément

2. **Gestion de la mémoire** :
   - Nettoyer les ressources non utilisées
   - Utiliser la pagination pour les listes longues
   - Optimiser les images avant upload

3. **Amélioration des temps de réponse** :
   - Mettre en cache les résultats des requêtes fréquentes
   - Utiliser des requêtes optimisées avec sélection de colonnes spécifiques
   - Implémenter le chargement paresseux (lazy loading) pour les composants lourds
