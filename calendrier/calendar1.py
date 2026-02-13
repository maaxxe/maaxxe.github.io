import re
import json

# Couleurs basées sur tes tags
COULEURS = {
    "important 1": "#ffcccc", "important 2": "#ffe5b4",
    "important 3": "#d1e9ff", "important 4": "#ffd1dc", "important 5": "#d1ffcf",
}

def extraire_donnees_md(nom_fichier):
    evenements = {}
    categorie_actuelle = None
    try:
        with open(nom_fichier, 'r', encoding='utf-8') as f:
            for ligne in f:
                cat_match = re.search(r'#important (\d)', ligne)
                if cat_match: 
                    categorie_actuelle = f"important {cat_match.group(1)}"
                
                # Capture : Texte + Date (Format DD/MM/YYYY)
                date_match = re.search(r'- \[ \] (.*?) \((\d{2}/\d{2}/(\d{4}))\)', ligne)
                if date_match and categorie_actuelle:
                    texte, date_str = date_match.group(1), date_match.group(2)
                    evenements.setdefault(date_str, []).append({
                        'texte': texte, 
                        'couleur': COULEURS.get(categorie_actuelle, "#f0f0f0")
                    })
        return evenements
    except FileNotFoundError:
        return {}

def generer_html_dynamique(evenements):
    # On transforme le dictionnaire Python en JSON pour le JavaScript
    json_data = json.dumps(evenements, ensure_ascii=False)

    html_template = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Mon Calendrier Interactif</title>
        <style>
            body {{ font-family: 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; flex-direction: column; align-items: center; padding: 20px; }}
            .header {{ background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; display: flex; gap: 15px; align-items: center; }}
            select, button {{ padding: 10px; border-radius: 5px; border: 1px solid #ccc; font-size: 1rem; cursor: pointer; }}
            button {{ background: #007bff; color: white; border: none; font-weight: bold; }}
            button:hover {{ background: #0056b3; }}
            
            #calendar-container {{ background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 90%; max-width: 1000px; }}
            table {{ width: 100%; border-collapse: collapse; table-layout: fixed; }}
            th {{ background: #f8f9fa; padding: 10px; border: 1px solid #ddd; color: #555; }}
            td {{ border: 1px solid #ddd; height: 100px; vertical-align: top; padding: 5px; position: relative; }}
            .date-num {{ font-weight: bold; color: #333; margin-bottom: 5px; }}
            .event {{ font-size: 0.75rem; padding: 3px 6px; margin-bottom: 3px; border-radius: 4px; border-left: 3px solid rgba(0,0,0,0.2); }}
            .today {{ background: #fff9c4 !important; }}
        </style>
    </head>
    <body>

    <div class="header">
        <button onclick="changeMonth(-1)">«</button>
        <select id="monthSelect" onchange="renderCalendar()"></select>
        <select id="yearSelect" onchange="renderCalendar()"></select>
        <button onclick="changeMonth(1)">»</button>
    </div>

    <div id="calendar-container">
        <h2 id="monthTitle" style="text-align: center;"></h2>
        <table id="calendarTable">
            <thead>
                <tr>
                    <th>Lun</th><th>Mar</th><th>Mer</th><th>Jeu</th><th>Ven</th><th>Sam</th><th>Dim</th>
                </tr>
            </thead>
            <tbody id="calendarBody"></tbody>
        </table>
    </div>

    <script>
        const evenements = {json_data};
        const monthSelect = document.getElementById('monthSelect');
        const yearSelect = document.getElementById('yearSelect');
        const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

        // Initialisation des listes
        for (let i = 0; i < 12; i++) {{
            let opt = document.createElement('option');
            opt.value = i; opt.text = months[i];
            monthSelect.appendChild(opt);
        }}
        for (let i = 2024; i <= 2030; i++) {{
            let opt = document.createElement('option');
            opt.value = i; opt.text = i;
            yearSelect.appendChild(opt);
        }}

        // Date actuelle par défaut
        let now = new Date();
        monthSelect.value = now.getMonth();
        yearSelect.value = now.getFullYear();

        function changeMonth(step) {{
            monthSelect.value = parseInt(monthSelect.value) + step;
            renderCalendar();
        }}

        function renderCalendar() {{
            const month = parseInt(monthSelect.value);
            const year = parseInt(yearSelect.value);
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // Ajuster car getDay() commence par Dimanche (0)
            let startingDay = firstDay === 0 ? 6 : firstDay - 1;
            
            const body = document.getElementById('calendarBody');
            body.innerHTML = '';
            document.getElementById('monthTitle').innerText = months[month] + " " + year;

            let date = 1;
            for (let i = 0; i < 6; i++) {{
                let row = document.createElement('tr');
                for (let j = 0; j < 7; j++) {{
                    let cell = document.createElement('td');
                    if (i === 0 && j < startingDay) {{
                        cell.innerHTML = "";
                    }} else if (date > daysInMonth) {{
                        break;
                    }} else {{
                        let dateKey = String(date).padStart(2, '0') + "/" + String(month + 1).padStart(2, '0') + "/" + year;
                        let cellContent = `<div class="date-num">${{date}}</div>`;
                        
                        if (evenements[dateKey]) {{
                            evenements[dateKey].forEach(ev => {{
                                cellContent += `<div class="event" style="background-color:${{ev.couleur}}">${{ev.texte}}</div>`;
                            }});
                        }}
                        cell.innerHTML = cellContent;
                        date++;
                    }}
                    row.appendChild(cell);
                }}
                body.appendChild(row);
                if (date > daysInMonth) break;
            }}
        }}

        renderCalendar();
    </script>
    </body>
    </html>
    """
    
    with open("calendrier.html", "w", encoding="utf-8") as f:
        f.write(html_template)
    print("Calendrier dynamique généré : calendrier.html")

# Lancement
donnees = extraire_donnees_md('calendar1.md')
generer_html_dynamique(donnees)