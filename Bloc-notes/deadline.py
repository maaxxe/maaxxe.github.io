#!/usr/bin/env python3
from datetime import datetime, timedelta
import subprocess

# DATE RENDU (change ici)
DATE_RENDU = datetime(2026, 2, 20, 23, 59, 59)

def jours_restants():
    maintenant = datetime.now()
    diff = DATE_RENDU - maintenant
    return max(0, diff.days)

def couleur(jours):
    if jours == 0: return "🟢 RENDU !"
    elif jours <= 4: return f"🔴 {jours}j URGENT"
    elif jours <= 7: return f"🟡 {jours}j ATTENTION"
    else: return f"🟢 {jours}j OK"

# Affiche + lance serveur
print(couleur(jours_restants()))
subprocess.run(["python3", "-m", "http.server", "8000"])
