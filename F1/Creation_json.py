import requests
import json
from pathlib import Path
from collections import defaultdict

BASE_URL = "https://api.jolpi.ca/ergast/f1"
# dossier = Path("../Json_results_f1")
# dossier.mkdir(exist_ok=True)

year = 2024

# Schedule
url_schedule = f"{BASE_URL}/{year}.json?limit=500"
resp_schedule = requests.get(url_schedule)
if resp_schedule.status_code != 200:
    print("❌ Schedule erreur")
    exit(1)

data_schedule = resp_schedule.json()
races = data_schedule["MRData"]["RaceTable"]["Races"]
print(f"✅ {len(races)} courses {year}")

json_complet = {"year": year, "courses": {}}

for race in races:
    round_num = race["round"]
    print(f"Course {round_num}: {race['raceName']}")
    
    course_data = {
        "round": round_num,
        "race_name": race["raceName"],
        "circuit": race["Circuit"]["circuitName"],
        "sessions": {"race": [], "qualifying": []},
        "pitstops": {}
    }
    
    # RACE + MEILLEUR TOUR
    race_resp = requests.get(f"{BASE_URL}/{year}/{round_num}/results.json")
    if race_resp.status_code == 200:
        race_data = race_resp.json()["MRData"]["RaceTable"]["Races"][0]
        for r in race_data["Results"]:
            fastest = r.get("FastestLap", {})
            course_data["sessions"]["race"].append({
                "position": int(r["position"]),
                "driver": f'{r["Driver"]["givenName"]} {r["Driver"]["familyName"]}',
                "code": r["Driver"]["code"],
                "team": r["Constructor"]["name"],
                "points": float(r.get("points", 0)),
                "fastest_lap_time": fastest.get("Time", {}).get("time"),
                "fastest_lap_rank": fastest.get("rank")
            })
    
    # QUALIFS
    quali_resp = requests.get(f"{BASE_URL}/{year}/{round_num}/qualifying.json")
    if quali_resp.status_code == 200:
        quali_data = quali_resp.json()["MRData"]["RaceTable"]["Races"][0]["QualifyingResults"]
        for r in quali_data:
            course_data["sessions"]["qualifying"].append({
                "position": int(r["position"]),
                "driver": f'{r["Driver"]["givenName"]} {r["Driver"]["familyName"]}',
                "q1": r.get("Q1"), "q2": r.get("Q2"), "q3": r.get("Q3")
            })
    
    # PITSTOPS (FIX : driverId direct)
    pits_resp = requests.get(f"{BASE_URL}/{year}/{round_num}/pitstops.json")
    if pits_resp.status_code == 200:
        pits = pits_resp.json()["MRData"]["RaceTable"]["Races"][0]["PitStops"]
        pitstops_by_driver = defaultdict(list)
        for p in pits:
            # FIX : driverId direct, pas nested Driver
            driver_id = p["driverId"]
            pitstops_by_driver[driver_id].append({
                "lap": int(p["lap"]),
                "stop": int(p["stop"]),
                "duration": p.get("duration"),
                "milliseconds": int(p.get("milliseconds", 0))
            })
        course_data["pitstops"] = dict(pitstops_by_driver)
        print("  ✅ Pits OK")
    
    json_complet["courses"][round_num] = course_data

fichier =f"f1_complet_sessions_{year}.json"
with open(fichier, "w", encoding="utf-8") as f:
    json.dump(json_complet, f, indent=2, ensure_ascii=False)

print(f"✅ {fichier} créé !")
