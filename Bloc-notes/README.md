# projet Blocnotes 

**Visualisez vos devoirs et deadlines en page HTML **  
Transforme fichier.md en site avec `make all`.

##  À quoi ça sert ?
- Voir **tous vos devoirs** avec liens et deadlines claires.
- Design **moderne/responsive** (mobile OK).
- **1 commande** pour générer et ouvrir.

##  Lancer (30 secondes)
1. Sauvegardez ce fichier comme `rendu.md`
2. Installez : `pip install markdown`


# makefile

## Help
    make help

        make serve     Convert + serveur + navigateur
        make convert   rendu.md → devoir.html
        make clean     rm devoir.html and stop serve
        make all       clean + convert + serve
        make stop      fuser -k 8000


## lancer 

    make serve
    ca compile ,lance un serveur et ouvre la page 

## arreter 

    make clean
    ca supprime le fichier html crée et kill le pid

##  Fermer
