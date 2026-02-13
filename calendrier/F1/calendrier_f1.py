import re
import json
import os

def extraire_donnees_f1(nom_fichier):
    evenements = {}
    gp_actuel = "Formule 1"
    try:
        if not os.path.exists(nom_fichier):
            print(f"Erreur : Le fichier {nom_fichier} est introuvable.")
            return {}
            
        with open(nom_fichier, 'r', encoding='utf-8') as f:
            for ligne in f:
                ligne = ligne.strip()
                if not ligne: continue

                cat_match = re.search(r'#GP\s+(.*)', ligne)
                if cat_match: 
                    gp_actuel = cat_match.group(1).replace(':', '').strip()
                    continue
                
                date_match = re.search(r'- \[(.*?)\] (.*?) \((\d{2}/\d{2}/\d{4})\) - (\d{2}:\d{2})', ligne)
                
                if date_match:
                    titre = date_match.group(2).strip()
                    date_str = date_match.group(3).strip()
                    heure_utc = date_match.group(4).strip()
                    
                    if date_str not in evenements:
                        evenements[date_str] = []
                        
                    evenements[date_str].append({
                        'gp': gp_actuel,
                        'titre': titre,
                        'heure': heure_utc,
                        'info': f" <b>Lieu :</b> {gp_actuel}<br> <b>Session :</b> {titre}<br> <b>Date :</b> {date_str}"
                    })
        return evenements
    except Exception as e:
        print(f"Erreur extraction : {e}")
        return {}

def generer_html(evenements):
    json_data = json.dumps(evenements, ensure_ascii=False)
    
    try:
        # 1. Lire le fichier template
        with open("template_f1.html", "r", encoding="utf-8") as f:
            template_content = f.read()
        
        # 2. Injecter le JSON à la place du marqueur
        final_html = template_content.replace("__JSON_DATA__", json_data)
        
        # 3. Sauvegarder le calendrier final
        with open("calendrier.html", "w", encoding="utf-8") as f:
            f.write(final_html)
            
    except FileNotFoundError:
        print("Erreur : Le fichier 'template_f1.html' est manquant !")
    except Exception as e:
        print(f"Erreur génération : {e}")

if __name__ == "__main__":
    # Assure-toi que ton fichier s'appelle bien 'courses.md'
    evenements = extraire_donnees_f1('courses.md')
    generer_html(evenements)
    print(f"✨ {len(evenements)} jours d'événements trouvés. Ouvre calendrier.html")