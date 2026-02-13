import re
import json

# Configuration des couleurs
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
                
                # Regex flexible pour capturer les tâches et dates
                date_match = re.search(r'- \[(.*?)\] (.*?) \((\d{2}/\d{2}/(\d{4}))\)', ligne)
                
                if date_match and categorie_actuelle:
                    texte = date_match.group(2).strip()
                    date_str = date_match.group(3).strip()
                    evenements.setdefault(date_str, []).append({
                        'texte': texte, 
                        'couleur': COULEURS.get(categorie_actuelle, "#f0f0f0")
                    })
        return evenements
    except Exception as e:
        print(f"Erreur lecture : {e}")
        return {}

def generer_html(evenements):
    json_data = json.dumps(evenements, ensure_ascii=False)

    # Utilisation de {{ }} pour échapper les accolades CSS/JS dans la f-string Python
    html_template = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Mon Calendrier Interactif</title>
        <style>
            body {{ font-family: 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; flex-direction: column; align-items: center; padding: 20px; }}
            .header {{ background: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 20px; display: flex; gap: 10px; align-items: center; }}
            select, button {{ padding: 10px; border-radius: 6px; border: 1px solid #ddd; font-size: 1rem; cursor: pointer; }}
            button {{ background: #333; color: white; border: none; font-weight: bold; width: 45px; }}
            button:hover {{ background: #555; }}
            
            #calendar-container {{ background: white; padding: 20px; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.1); width: 95%; max-width: 1100px; }}
            table {{ width: 100%; border-collapse: collapse; table-layout: fixed; }}
            th {{ background: #f8f9fa; padding: 12px; border: 1px solid #eee; color: #666; font-size: 0.85rem; text-transform: uppercase; }}
            td {{ border: 1px solid #eee; height: 110px; vertical-align: top; padding: 8px; transition: 0.2s; }}
            .date-num {{ font-weight: bold; color: #444; margin-bottom: 8px; }}
            .event {{ font-size: 0.75rem; padding: 4px 8px; margin-bottom: 4px; border-radius: 4px; border-left: 4px solid rgba(0,0,0,0.2); font-weight: 500; }}
            .today {{ background: #fffde7 !important; border: 2px solid #ffd600 !important; }}
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
        <h2 id="monthTitle" style="text-align: center; margin-top: 0;"></h2>
        <table>
            <thead>
                <tr><th>Lun</th><th>Mar</th><th>Mer</th><th>Jeu</th><th>Ven</th><th>Sam</th><th>Dim</th></tr>
            </thead>
            <tbody id="calendarBody"></tbody>
        </table>
    </div>

    <script>
        const evenements = {json_data};
        const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        
        const monthSelect = document.getElementById('monthSelect');
        const yearSelect = document.getElementById('yearSelect');

        // Remplissage des menus déroulants
        months.forEach((m, i) => monthSelect.add(new Option(m, i)));
        for (let i = 2024; i <= 2030; i++) yearSelect.add(new Option(i, i));

        // Initialisation à la date du jour
        let now = new Date();
        monthSelect.value = now.getMonth();
        yearSelect.value = now.getFullYear();

        function changeMonth(step) {{
            let m = parseInt(monthSelect.value) + step;
            let y = parseInt(yearSelect.value);
            if (m > 11) {{ m = 0; y++; }}
            else if (m < 0) {{ m = 11; y--; }}
            monthSelect.value = m;
            yearSelect.value = y;
            renderCalendar();
        }}

        function renderCalendar() {{
            const month = parseInt(monthSelect.value);
            const year = parseInt(yearSelect.value);
            const body = document.getElementById('calendarBody');
            
            // Calcul du premier jour (Lundi=0 ... Dimanche=6)
            let firstDay = new Date(year, month, 1).getDay();
            let startingDay = (firstDay === 0) ? 6 : firstDay - 1;
            let daysInMonth = new Date(year, month + 1, 0).getDate();
            
            body.innerHTML = '';
            document.getElementById('monthTitle').innerText = months[month] + " " + year;

            let date = 1;
            for (let i = 0; i < 6; i++) {{
                let row = document.createElement('tr');
                let hasData = false;
                for (let j = 0; j < 7; j++) {{
                    let cell = document.createElement('td');
                    if ((i === 0 && j < startingDay) || date > daysInMonth) {{
                        cell.innerHTML = "";
                    }} else {{
                        hasData = true;
                        let dateKey = String(date).padStart(2, '0') + "/" + String(month + 1).padStart(2, '0') + "/" + year;
                        
                        if (date === now.getDate() && month === now.getMonth() && year === now.getFullYear()) {{
                            cell.className = 'today';
                        }}

                        let html = `<div class="date-num">${{date}}</div>`;
                        if (evenements[dateKey]) {{
                            evenements[dateKey].forEach(ev => {{
                                html += `<div class="event" style="background-color:${{ev.couleur}}">${{ev.texte}}</div>`;
                            }});
                        }}
                        cell.innerHTML = html;
                        date++;
                    }}
                    row.appendChild(cell);
                }}
                if (hasData) body.appendChild(row);
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
    print("✨ Calendrier généré avec succès !")

donnees = extraire_donnees_md('calendar1.md')
generer_html(donnees)