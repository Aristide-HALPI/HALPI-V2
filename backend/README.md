# Documentation Backend HALPI V2

## Présentation

Le backend de HALPI V2 est construit avec FastAPI et sert à traiter les opérations complexes comme l'extraction de contenu à partir des chapitres de cours (PDF, DOCX, PPTX). Il communique avec Supabase pour le stockage des données.

## Prérequis

- Python 3.11.x (recommandé: Python 3.11.9)
- Pip (gestionnaire de paquets Python)
- Un compte Supabase avec les clés d'API

## Installation

### 1. Cloner le dépôt

```bash
git clone <URL_DU_REPO>
cd HALPI\ V2/backend
```

### 2. Créer un environnement virtuel

```bash
# Avec Python 3.11
py -3.11 -m venv venv

# Activer l'environnement virtuel
venv\Scripts\activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier `backend` avec le contenu suivant :

```
SUPABASE_URL=https://fpxwfjicjnrihmmbkwew.supabase.co
SUPABASE_KEY=<votre_clé_supabase>
```

## Démarrage du serveur

```bash
# Assurez-vous que l'environnement virtuel est activé
venv\Scripts\activate

# Démarrer le serveur
python run.py
```

Le serveur sera accessible à l'adresse : http://localhost:8000

## Fonctionnalités principales

### Extraction de contenu des chapitres

Le backend permet d'extraire le contenu textuel des fichiers de chapitres dans différents formats :

- **PDF** : Extraction avancée avec mise en page via `pdfplumber`
- **DOCX** : Extraction de texte via `python-docx`
- **PPTX** : Extraction de texte via `python-pptx`

### Points d'API

- **`/extract`** : Extrait le contenu d'un chapitre spécifique
- **`/extract-all`** : Extrait le contenu de tous les chapitres d'un cours
- **`/upload`** : Gère les téléchargements de fichiers associés aux chapitres

## Workflow d'utilisation

1. **Frontend** : L'utilisateur organise ses chapitres et clique sur "Enregistrer l'ordre"
2. **Backend** : 
   - Met à jour l'ordre et les titres des chapitres dans Supabase
   - Extrait automatiquement le contenu textuel de chaque chapitre
   - Convertit ce contenu en JSON structuré
   - Stocke ce JSON dans la colonne `json_data` de la table `chapters`
3. **Frontend** : Affiche la progression et le résultat de l'extraction

## Dépannage

### Problèmes courants

1. **Erreur "Module not found"** : Vérifiez que vous avez bien activé l'environnement virtuel et installé toutes les dépendances.

2. **Erreur de connexion à Supabase** : Vérifiez vos clés d'API dans le fichier `.env`.

3. **Erreur d'extraction de fichier** : Assurez-vous que les fichiers sont dans un format compatible et non corrompus.

### Commandes utiles

```bash
# Vérifier la version de Python
python --version

# Vérifier les packages installés
pip list

# Mettre à jour pip
python -m pip install --upgrade pip
```

## Mise à jour du backend

Pour mettre à jour le backend avec de nouvelles dépendances :

1. Ajoutez les nouvelles dépendances dans `requirements.txt`
2. Exécutez `pip install -r requirements.txt`
3. Redémarrez le serveur

## Notes importantes

- Le backend doit être démarré avant d'utiliser les fonctionnalités d'extraction dans le frontend.
- Assurez-vous que les ports requis (8000 par défaut) sont disponibles et non bloqués par un pare-feu.
- Les fichiers volumineux peuvent prendre plus de temps à traiter.
