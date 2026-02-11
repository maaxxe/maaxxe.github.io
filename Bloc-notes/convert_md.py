import markdown
import sys
import os
from datetime import datetime, timedelta
import re

today = datetime.today().date()

def color_deadline(full_html):
    """Colore dates ET blocs selon deadline précise"""
    
    # Fonction helper pour calculer couleur
    def get_colors(days_left, is_done):
        if is_done:
            return "#10b981", "#d1fae5", "#059669"  # date, fond, bord
        elif days_left <= 4:
            return "#ef4444", "#fee2e2", "#dc2626"  # rouge
        elif days_left <= 7:
            return "#f59e0b", "#fef3c7", "#d97706"  # jaune
        else:
            return "#3b82f6", "#dbeafe", "#2563eb"  # bleu
    
    # 1️⃣ TRAITER CHAQUE <li> individuellement
    li_pattern = r'<li[^>]*>(.*?)</li>'
    matches = re.finditer(li_pattern, full_html, re.DOTALL)
    
    for match in matches:
        li_content = match.group(1)
        full_li = match.group(0)
        
        # Chercher date dans ce <li>
        date_match = re.search(r'\d{1,2}\s+\w+(?:\.)?\s+\d{4}(?::?\s*\d{1,2}:\d{2})?', li_content)
        if not date_match:
            continue
            
        raw_date = date_match.group()
        months = {"janv.": 1, "fév.": 2, "mars": 3, "avril": 4, "mai": 5, "juin": 6,
                  "juil.": 7, "août": 8, "sept.": 9, "oct.": 10, "nov.": 11, "déc.": 12}
        
        parts = raw_date.strip(".").split()
        if len(parts) < 3:
            continue
            
        try:
            day = int(parts[0])
            month_name = parts[1]
            year = int(parts[2][:4])
            month = months.get(month_name)
            if not month:
                continue
            deadline = datetime(year, month, day).date()
            days_left = (deadline - today).days
        except:
            continue
        
        # ✅ DÉTECTION PRÉCISE : UNIQUEMENT [x] ou <del>
        is_done = re.search(r'\[x\]', li_content, re.IGNORECASE) or '<del>' in li_content
        
        date_color, bg_color, border_color = get_colors(days_left, is_done)
        
        # 2️⃣ COLORER LA DATE (badge)
        styled_date = f'<span style="color: {date_color}; font-weight: 600; background: rgba(255,255,255,0.9); padding: 4px 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">{raw_date}</span>'
        li_content = li_content.replace(raw_date, styled_date)
        
        # 3️⃣ COLORER LE BLOC ENTIER
        styled_li = f'<li style="background: {bg_color} !important; border-left: 6px solid {border_color} !important; border-radius: 12px !important;">{li_content}</li>'
        
        full_html = full_html.replace(full_li, styled_li)
    
    return full_html

try:
    import markdown
except ImportError:
    print("❌ Installez: pip install markdown")
    sys.exit(1)

md_file = 'rendu.md'
if not os.path.exists(md_file):
    print(f"❌ {md_file} introuvable. Créez-le avec votre liste de devoirs.")
    sys.exit(1)

css = '''
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
    font-family: 'Inter', sans-serif; 
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
    min-height: 100vh; 
    padding: 2rem; 
    line-height: 1.6; 
    color: #333; 
}
.container { max-width: 900px; margin: 0 auto; }
header { text-align: center; margin-bottom: 3rem; background: white; padding: 2rem; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
h1 { font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem; }
header p { font-size: 1.1rem; color: #666; }
h2 { font-size: 1.6rem; font-weight: 600; color: #4a5568; margin: 2rem 0 1rem 0; border-left: 5px solid #667eea; padding-left: 1.5rem; }
ul { list-style: none; }
li { padding: 1.2rem; background: #f8f9ff; margin-bottom: 1rem; border-radius: 12px; border-left: 4px solid #e2e8f0; transition: all 0.3s ease; }
li:hover { transform: translateX(5px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
li a { color: #1e40af; text-decoration: none; font-weight: 500; }
li a:hover { text-decoration: underline; }
@media (max-width: 768px) { body { padding: 1rem; } h1 { font-size: 2rem; } }
'''

with open(md_file, 'r', encoding='utf-8') as f:
    md_content = f.read()

html_content = markdown.markdown(md_content, extensions=['extra', 'tables', 'fenced_code'])

# 🎨 APPLIQUE COLORATION
colored_html = color_deadline(html_content)

full_html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mes Devoirs - Février 2026</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>{css}</style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Mes Devoirs</h1>
            <p>Février 2026</p>
        </header>
        {colored_html}
    </div>
</body>
</html>'''

with open('devoir.html', 'w', encoding='utf-8') as f:
    f.write(full_html)

print("✅ devoir.html généré ! Dates + blocs colorés selon DEADLINE → make serve")
