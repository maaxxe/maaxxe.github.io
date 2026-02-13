# --- CONFIGURATION PROJET 1 (Cours/Rendus) ---
PORT=8000
SCRIPT=./calendar1.py
MD_FILE=./calendar1.md
HTML_FILE=./devoir.html

# --- CONFIGURATION PROJET 2 (F1) ---
PORT_F1=8001
SCRIPT_F1=./F1/calendrier_f1.py
MD_FILE_F1=./F1/courses.md
HTML_FILE_F1=./F1/calendrier.html

# --- COULEURS ---
GREEN=\033[0;32m
RED=\033[0;31m
YELLOW=\033[1;33m
NC=\033[0m

.PHONY: all clean help status stop convert serve convertf1 servef1 stopf1 cleanf1

# ==========================================
# PROJET 1 : COURS / RENDUS
# ==========================================

serve: convert
	python3 -m http.server $(PORT) &
	sleep 2 && xdg-open http://localhost:$(PORT)/$(HTML_FILE)

convert:
	@if [ ! -f "$(MD_FILE)" ]; then echo "$(RED)$(MD_FILE) introuvable$(NC)"; exit 1; fi
	python3 $(SCRIPT)
	@echo "$(GREEN)$(HTML_FILE) généré !$(NC)"

stop:
	fuser -k $(PORT)/tcp 2>/dev/null || true
	@echo "$(YELLOW)Serveur Cours ($(PORT)) arrêté$(NC)"

clean: stop
	rm -f $(HTML_FILE)
	@echo "$(RED)$(HTML_FILE) supprimé$(NC)"

# ==========================================
# PROJET 2 : FORMULE 1
# ==========================================

servef1: convertf1
	python3 -m http.server $(PORT_F1) &
	sleep 2 && xdg-open http://localhost:$(PORT_F1)/F1/calendrier.html

convertf1:
	@if [ ! -f "$(MD_FILE_F1)" ]; then echo "$(RED)$(MD_FILE_F1) introuvable$(NC)"; exit 1; fi
	python3 $(SCRIPT_F1)
	@echo "$(GREEN)$(HTML_FILE_F1) généré !$(NC)"

stopf1:
	fuser -k $(PORT_F1)/tcp 2>/dev/null || true
	@echo "$(YELLOW)Serveur F1 ($(PORT_F1)) arrêté$(NC)"

cleanf1: stopf1 
	rm -f $(HTML_FILE_F1)
	@echo "$(RED)$(HTML_FILE_F1) supprimé$(NC)"

# ==========================================
# COMMANDES GLOBALES
# ==========================================
cleanall: stop stopf1 clean cleanf1
	rm -f $(HTML_FILE_F1)
	@echo "$(RED)$(HTML_FILE_F1) supprimé$(NC)"

status:
	@fuser $(PORT)/tcp >/dev/null 2>&1 && echo "$(GREEN)Cours: ACTIF (Port $(PORT))$(NC)" || echo "$(RED)Cours: ARRÊTÉ$(NC)"
	@fuser $(PORT_F1)/tcp >/dev/null 2>&1 && echo "$(GREEN)F1:    ACTIF (Port $(PORT_F1))$(NC)" || echo "$(RED)F1:    ARRÊTÉ$(NC)"

all: clean cleanf1 convert convertf1
	@echo "$(GREEN)Tout a été réinitialisé et converti !$(NC)"

help:
	@echo "$(YELLOW)--- PROJET COURS ---$(NC)"
	@echo "  make serve      : Convertir + Lancer Serveur (Port 8000)"
	@echo "  make convert    : Générer $(HTML_FILE)"
	@echo "  make stop       : Arrêter le serveur 8000"
	@echo "  make clean      : Supprimer HTML + Arrêter serveur"
	@echo ""
	@echo "$(YELLOW)--- PROJET F1 ---$(NC)"
	@echo "  make servef1    : Convertir + Lancer Serveur F1 (Port 8001)"
	@echo "  make convertf1  : Générer $(HTML_FILE_F1)"
	@echo "  make stopf1     : Arrêter le serveur 8001"
	@echo "  make cleanf1    : Supprimer HTML F1 + Arrêter serveur"
	@echo ""
	@echo "$(YELLOW)--- COMMANDES GLOBALES ---$(NC)"
	@echo "  make cleanall   : Supprimer HTML + Arrêter serveurs"
	@echo "  make status     : Vérifier état serveurs"
	@echo "  make all        : Réinitialiser + Convertir + Lancer serveurs"