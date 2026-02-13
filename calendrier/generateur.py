import re
import json
import os
import time

# Configuration des couleurs
COULEURS = {
    "important 1": "#ffcccc", "important 2": "#ffe5b4",
    "important 3": "#d1e9ff", "important 4": "#ffd1dc", "important 5": "#d1ffcf",
}

def extraire_donnees():
    evenements = {}
    cat_actuelle = None
    if not os.path.exists('notes.md'): return {}
    
    with open('notes.md', 'r', encoding='utf-8') as f:
        for ligne in f:
            # Trouve le tag #important X
            cat_match = re.search(r'#important (\d)', ligne)
            if cat_match: cat_actuelle = f"important {cat_match.group(1)}"
            
            # Trouve la tâche et la date
            date_match = re.search(r'- \[.\] (.*?) \((\d{2}/\d{2}/\d{4})\)', ligne)
            if date_match and cat_actuelle:
                texte, date_str = date_match.group(1), date_match.group(2)
                evenements.setdefault(date_str, []).append({
                    'texte': texte, 'couleur': COULEURS.get(cat_actuelle, "#eee")
                })
    return evenements

def compiler():
    donnees = extraire_donnees()
    with open('template.html', 'r', encoding='utf-8') as f:
        html = f.read().replace('{{donnees_evenements}}', json.dumps(donnees))
    with open('calendrier.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("✨ Calendrier mis à jour avec succès !")

if __name__ == "__main__":
    # Première génération
    compiler()
    
    # Mode surveillance (optionnel : rafraîchit si tu modifies le .md)
    print("Surveillance de 'notes.md'... Modifie ton fichier pour voir l'effet.")
    mtime = os.path.getmtime('notes.md')
    try:
        while True:
            time.sleep(1)
            new_mtime = os.path.getmtime('notes.md')
            if new_mtime != mtime:
                compiler()
                mtime = new_mtime
    except KeyboardInterrupt:
        print("\nArrêt.")