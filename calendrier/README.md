#  Dashboard 2026 : Études & Formule 1

Ce projet est une solution de gestion personnelle automatisée. Il utilise des scripts Python pour transformer des fichiers de notes simples (`.md`) en calendriers web.

---

###  Arborescence du Projet

```text
.
├── calendar1.py           # Générateur du calendrier scolaire
├── template.html          # Design du calendrier scolaire
├── calendar1.md           # Tes devoirs et deadlines (Source)
├── Makefile               # Commandes globales
├── F1/                    # --- SOUS-DOSSIER F1 ---
│   ├── calendrier_f1.py   # Générateur F1
│   ├── template_f1.html   # Design typé F1 (Red & Carbon)
│   ├── courses.md         # Calendrier officiel F1 (Source)
│   ├── calendrier.html    # Résultat généré (F1)
│   └── Makefile           # Commandes spécifiques F1
└── devoir.html           # Résultat généré (Cours)

# Présentation des Modules
## 1. Calendrier Scolaire (Racine)

Le but est de ne jamais rater une deadline.

    Format de saisie : Supporte les dates numériques (13/02/2026) ou textuelles (13 février 2026).

    Notes cachées : Utilise // dans ton .md pour ajouter des détails qui n'apparaîtront que lors d'un clic sur l'événement dans le calendrier.

    Codes Couleurs : Utilise #important 1 à 5 pour prioriser tes tâches par couleur.

## 2. Calendrier F1 Pro (Dossier /F1)

Un outil de suivi complet pour la saison 2026.

    Gestion UTC : Les heures sont stockées en UTC 0 et converties dynamiquement dans le navigateur selon ton fuseau horaire.

    Détails des Sessions : Affiche les Essais Libres, Qualifications, Sprints et Grands Prix avec des infos spécifiques au circuit.

## Utilisation Rapide

Le projet est entièrement automatisé via les Makefiles.

make help

## Astuces de Saisie (.md)

Pour tes devoirs :

#important 1
- [ ] Faire TP1 en science (17/02/2026) // Attention : assez dur, vérifier chapitre 3

Pour la F1 :

#GP Australie :
- [ ] Course (15/03/2026) - 05:00









