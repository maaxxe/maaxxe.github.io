# 🏎️ F1 & Student Planner 2026

### 🎯 But du Projet
Ce système permet de convertir des fichiers de données texte (`.md`) en interfaces web interactives. Le but est de centraliser la gestion des **deadlines de cours** et le suivi de la **saison F1 2026** avec une gestion dynamique des fuseaux horaires.

---

### 📂 Arborescence du Projet

```text
.
├── calendar1.py           # Moteur principal (Rendus & Cours)
├── template.html          # Design du calendrier scolaire
├── Makefile               # Automatisation racine
└── F1/                    # Dossier spécialisé Formule 1
    ├── calendrier_f1.py   # Script de génération F1
    ├── courses.md         # Liste des GP et horaires UTC 0
    ├── template_f1.html   # Design typé F1 (Red & Carbon)
    ├── calendrier.html    # Résultat généré (F1)
    └── Makefile           # Automatisation spécifique F1