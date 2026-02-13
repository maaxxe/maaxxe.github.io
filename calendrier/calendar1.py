import re
import json
import os
from datetime import datetime

COULEURS = {
    "important 1": "#ffcccc", 
    "important 2": "#ffe5b4",
    "important 3": "#d1e9ff", 
    "important 4": "#ffd1dc", 
    "important 5": "#d1ffcf",
}

# Dictionnaire pour convertir les mois écrits en chiffres
MOIS_FR = {
    'janvier': 1, 'fevrier': 2, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
    'juillet': 7, 'aout': 8, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'decembre': 12, 'décembre': 12
}

def validation_date(date_str):
    """Valide que la date existe réellement (ex: évite le 31 février)"""
    try:
        datetime.strptime(date_str, '%d/%m/%Y')
        return True
    except ValueError:
        return False

def extraire_donnees_md(nom_fichier):
    evenements = {}
    categorie_actuelle = "important 3"
    
    if not os.path.exists(nom_fichier):
        print(f"Erreur : {nom_fichier} introuvable")
        return {}

    try:
        with open(nom_fichier, 'r', encoding='utf-8') as f:
            for ligne in f:
                ligne = ligne.strip()
                if not ligne: continue
                
                # 1. Détection de la catégorie
                cat_match = re.search(r'#important (\d)', ligne)
                if cat_match: 
                    categorie_actuelle = f"important {cat_match.group(1)}"
                    continue
                
                # 2. Regex simplifiée pour capturer : - [ ] Titre (Date) // Commentaire
                # On cherche d'abord le titre entre crochets, puis la date entre parenthèses
                match = re.search(r'- \[(.*?)\] (.*?) \((.*?)\)(?: // (.*))?', ligne)
                
                if match:
                    # Groupe 1: ce qu'il y a dans [ ] (souvent vide pour une checkbox)
                    # Groupe 2: le titre de la tâche
                    # Groupe 3: la date (numérique ou texte)
                    # Groupe 4: le commentaire après //
                    
                    titre = match.group(2).strip()
                    raw_date = match.group(3).strip()
                    commentaire = match.group(4).strip() if match.group(4) else ""
                    
                    date_str = None

                    # CAS A : Date numérique (13/02/2026)
                    if re.match(r'\d{1,2}/\d{1,2}/\d{4}', raw_date):
                        parts = raw_date.split('/')
                        date_str = f"{parts[0].zfill(2)}/{parts[1].zfill(2)}/{parts[2]}"
                    
                    # CAS B : Date textuelle (13 février 2026)
                    else:
                        parts = raw_date.split()
                        if len(parts) == 3:
                            jour = parts[0].zfill(2)
                            mois_nom = parts[1].lower()
                            annee = parts[2]
                            mois_num = MOIS_FR.get(mois_nom)
                            if mois_num:
                                date_str = f"{jour}/{mois_num:02d}/{annee}"

                    # 3. Validation et stockage
                    if date_str and validation_date(date_str):
                        evenements.setdefault(date_str, []).append({
                            'texte': titre, 
                            'commentaire': commentaire,
                            'couleur': COULEURS.get(categorie_actuelle, "#f0f0f0")
                        })
        
        return evenements
    except Exception as e:
        print(f"Erreur extraction : {e}")
        return {}

def generer_html(evenements):
    json_data = json.dumps(evenements, ensure_ascii=False)
    try:
        if not os.path.exists("template.html"):
            print("Erreur : template.html manquant")
            return

        with open("template.html", "r", encoding="utf-8") as f:
            template_content = f.read()
            
        final_html = template_content.replace("__JSON_DATA__", json_data)
        
        # Enregistre sous devoir.html pour correspondre au Makefile
        with open("devoir.html", "w", encoding="utf-8") as f:
            f.write(final_html)
            
        print(f"✅ Succès : {sum(len(v) for v in evenements.values())} événements générés dans devoirr.html")
    except Exception as e:
        print(f"Erreur génération : {e}")

if __name__ == "__main__":
    donnees = extraire_donnees_md('calendar1.md')
    generer_html(donnees)