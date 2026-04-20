# 🚀 Maxime Robin – Portfolio & Outils Techniques

Bienvenue sur le dépôt de mon portfolio personnel et de mes outils de gestion. Ce projet centralise mes réalisations en **Intelligence Artificielle**, **Systèmes Embarqués** et **Développement Web**.

🌐 **Lien du site :** [maaxxe.github.io](https://maaxxe.github.io)

---

## 📂 Architecture du Projet

```text
.
├── 📄 index.html             # Page d'accueil principale (FR)
├── 📄 index_en.html          # Page d'accueil (EN)
├── 📁 Bloc-notes             # Gestion des devoirs (Markdown ➔ HTML)
├── 📁 calendrier             # Générateur de calendriers scolaires & F1
├── 📁 CV                     # Versions PDF de mon curriculum vitæ
├── 📁 F1                     # Tracker et données de la saison de Formule 1
├── 📁 labyrinthe             # Résolveur de labyrinthe (C + WebAssembly)
├── 📁 Sudoku                 # Générateur de Sudoku (C + HTML/JS)
├── 📁 outils                 # Dashboard centralisant tous les outils web
├── 📁 projet_detection       # Scripts de détection (Caméra / IA)
├── 📁 conversion_cv          # Outils de mise en forme CSS pour CV
└── 📁 Workflows              # Automation GitHub Actions (Génération PDF)
```

---

## 🛠️ Description des Modules

### 1. Portfolio Web (`index.html`, `js/`, `style.css`)
Site vitrine moderne présentant mon parcours académique (ESEO, Université de Sherbrooke), mes expériences chez Stellantis et Kereval, ainsi que mes compétences techniques.

### 2. Gestion et Automatisation
- **Calendrier Scolaire & F1 (`/calendrier`)** : Script Python qui transforme des notes au format Markdown en un calendrier interactif HTML. Gère les deadlines, les niveaux d'importance et les décalages horaires (UTC) pour la F1.
- **Bloc-notes (`/Bloc-notes`)** : Outil similaire au calendrier, spécialisé pour le suivi rapide des devoirs et projets.

### 3. Jeux & Expériences Interactive
- **Labyrinthe (`/labyrinthe`)** : Un moteur écrit en **C**, compilé en **WebAssembly (WASM)** pour une exécution fluide dans le navigateur.
- **Sudoku (`/Sudoku`)** : Générateur de grilles utilisant un moteur de résolution performant en C, intégré à une interface web responsive.

### 4. Projets Techniques
- **F1 Tracker (`/F1`)** : Centralise les sessions de Grands Prix avec injection dynamique de données via JSON.
- **Détection IA (`/projet_detection`)** : Base de travail pour les projets de vision par ordinateur et détection d'intrusion.

---

## 💻 Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Backend & Scripts** : Python, C
- **Compilation** : WebAssembly (Emscripten), Makefiles
- **Automation** : GitHub Actions, YAML
- **Data** : JSON, Markdown

---

## 📖 Utilisation

Le projet utilise un **Makefile** à la racine pour simplifier la gestion des différents modules.

### Commandes Globales
- `make all` : Compile tous les sous-projets (WASM, Calendriers, etc.).
- `make clean` : Nettoie les fichiers générés et arrête les serveurs.
- `make serve` : Lance le serveur global sur [http://localhost:8000](http://localhost:8000).

### Lancer un projet spécifiquement
- `make notes` : Lance le **Bloc-notes** (Port 8000).
- `make cal` : Lance le **Calendrier Scolaire** (Port 8000).
- `make f1` : Lance le **Calendrier F1** (Port 8001).
- `make lab` : Lance le jeu du **Labyrinthe** (Port 8000).

---

### Notes Techniques
Les notes concernant l'hébergement local avancé et les commandes pour la caméra ont été déplacées vers le fichier :
👉 **[notes_techniques.md](./notes_techniques.md)**

---
*Dépôt maintenu par [Maxime Robin](https://github.com/maaxxe)*
