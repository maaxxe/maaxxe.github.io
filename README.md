# 🚀 Maxime Robin – Portfolio & Écosystème Technique

[![Lien du site](https://img.shields.io/badge/Site-maaxxe.github.io-blue?style=for-the-badge&logo=github)](https://maaxxe.github.io)
[![Langue](https://img.shields.io/badge/Langage-Python%20%7C%20C%20%7C%20WASM-orange?style=for-the-badge)](https://maaxxe.github.io)

Bienvenue dans mon espace de travail technique. Ce dépôt n'est pas seulement un portfolio, mais un véritable écosystème regroupant des outils d'automatisation, des projets de systèmes embarqués et des expérimentations en Intelligence Artificielle.

---

##  Architecture Technique

Ce projet repose sur trois piliers technologiques :

1.  **Le Web Performance** : Utilisation de **WebAssembly (WASM)** pour porter des moteurs de calcul écrits en **C** directement dans le navigateur (ex: Labyrinthe).
2.  **L'Automatisation** : Scripts **Python** personnalisés pour la transformation de flux de données Markdown vers des interfaces HTML interactives.
3.  **L'Intégration Continue** : Workflows **GitHub Actions** pour la synchronisation et la génération automatique de contenus (CV, déploiement).

---

## 📂 Organisation du Dépôt

```text
.
├──  Racine
│   ├── index.html             # Landing page multilingue
│   ├── style.css              # Design system global (Glassmorphism)
│   └── Makefile               # Orchestrateur global
│
├──  Outils & Automatisation
│   ├──  Bloc-notes          # Suivi des deadlines (Python ➔ HTML)
│   ├──  calendrier           # Générateur scolaire & Formule 1
│   └──  conversion_cv       # Pipeline de stylisation pour CV
│
├──  Expériences Interactives
│   ├──  labyrinthe          # Algorithmes de résolution (C/WASM)
│   └──  Sudoku              # Générateur par backtracking (C/JS)
│
└──  Systèmes & IA
    ├──  projet_detection    # Acquisition vidéo (OpenCV/Python)
    └──  Workflows           # CI/CD (GitHub Actions)
```

---

##  Installation & Prérequis

Pour exploiter pleinement cet environnement en local, vous aurez besoin des outils suivants :

###  Python (Automatisation)
Utilisé pour les calendriers et le bloc-notes.
```bash
pip install markdown
```

###  Compilation C & WASM
Nécessaire pour les jeux et les générateurs.
- **GCC** (Linux/macOS) pour le Sudoku.
- **Emscripten (emcc)** pour le Labyrinthe.
```bash
# Installation sur Ubuntu
sudo apt install gcc python3 emscripten
```

---

##  Utilisation (Makefile)

Le projet utilise un système de Makefiles chaînés. Vous pouvez tout piloter depuis la racine.

### Commandes Globales
| Commande | Action |
| :--- | :--- |
| `make all` | **Tout compiler** (WASM, Sudoku, Calendriers) |
| `make serve` | Lancer le **serveur global** (Port 8000) |
| `make clean` | **Nettoyer** tous les fichiers générés |

### Gestion par Projet
- `make notes` : Lance le service de gestion des devoirs.
- `make cal` : Lance le calendrier scolaire.
- `make f1` : Lance le tracker F1 (Port 8001).
- `make lab` : Lance le simulateur de labyrinthe.

---

##  CI/CD & Automatisation

Le dossier `.github/workflows` (référencé par `Workflows/`) contient les automates qui :
- Génèrent vos CV PDF à partir de sources HTML/CSS dès qu'une modification est détectée.
- S'assurent que le déploiement sur GitHub Pages est optimal.

---

## Notes Supplémentaires

Pour les détails sur la configuration des caméras ou les commandes serveurs brutes :
 Consultez **[notes_techniques.md](./notes_techniques.md)**

---
*Dépôt de [Maxime Robin](https://github.com/maaxxe) – Étudiant Ingénieur IA & Systèmes Embarqués.*
