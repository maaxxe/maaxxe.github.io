# Makefile Serveur 8000 - dossier src/
PORT=8000
SCRIPT=./calendar1.py
MD_FILE=./calendar1.md

GREEN=\033[0;32m
RED=\033[0;31m
YELLOW=\033[1;33m
NC=\033[0m

.PHONY: serve stop status help clean all

# Convert + Serveur + navigateur
serve: convert
	python3 -m http.server $(PORT) &
	sleep 2 && xdg-open http://localhost:$(PORT)/calendrier.html

# Convertit rendu.md → calendrier.html
convert:
	@if [ ! -f "$(MD_FILE)" ]; then \
		echo "$(RED) $(MD_FILE) introuvable$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "$(SCRIPT)" ]; then \
		echo "$(RED) $(SCRIPT) introuvable$(NC)"; \
		exit 1; \
	fi
	python3 $(SCRIPT)
	@echo "$(GREEN)calendrier.html généré ! → http://localhost:$(PORT)/calendrier.html$(NC)"

#  Ferme serveur
stop:
	fuser -k $(PORT)/tcp 2>/dev/null || true
	@echo "$(GREEN) Serveur $(PORT) arrêté$(NC)"

# 
status:
	@if fuser $(PORT)/tcp >/dev/null 2>&1; then \
		echo "$(GREEN) Serveur $(PORT) ACTIF$(NC)"; \
	else \
		echo "$(RED) Serveur $(PORT) ARRÊTÉ$(NC)"; \
	fi

#  Tout en 1
all: clean convert serve

# SUPPRIME calendrier.html (comme demandé)
clean: stop
	
	rm -f calendrier.html
	@echo "$(GREEN)calendrier.html supprimé$(NC)"

#  Aide
help:
	@echo "$(GREEN)📋 Makefile calendar1s$(NC)"
	@echo "  $(GREEN)make serve$(NC)     Convert + serveur + navigateur"
	@echo "  $(GREEN)make convert$(NC)  rendu.md → calendrier.html"
	@echo "  $(GREEN)make clean$(NC)    rm calendrier.html and stop serve"
	@echo "  $(GREEN)make all$(NC)       clean + convert + serve"
	@echo "  $(GREEN)make stop$(NC)      fuser -k 8000"
	@echo ""
	@echo "$(YELLOW)Fichiers : $(SCRIPT) & $(MD_FILE)$(NC)"
