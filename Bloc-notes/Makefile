# Makefile Serveur 8000 - Linux fuser
PORT=8000

GREEN=\033[0;32m
RED=\033[0;31m
YELLOW=\033[1;33m
NC=\033[0m

.PHONY: serve stop status help

# 🚀 Serveur Python 8000 + navigateur
serve:
	python3 -m http.server $(PORT) &
	sleep 2 && xdg-open http://localhost:$(PORT)/devoir.html

# 🛑 Ferme serveur
stop:
	fuser -k $(PORT)/tcp

# 📊
status:
	@if fuser $(PORT)/tcp >/dev/null 2>&1; then \
		echo "$(GREEN)🟢 Serveur $(PORT) ACTIF$(NC)"; \
	else \
		echo "$(RED)🔴 Serveur $(PORT) ARRÊTÉ$(NC)"; \
	fi

convert:
	python3 convert_md.py

all: convert serve

# ❓ Aide
help:
	@echo "$(GREEN)📋 Makefile Serveur 8000$(NC)"
	@echo "  $(GREEN)make serve$(NC)    🚀 Lance serveur + ouvre navigateur"
	@echo "  $(GREEN)make stop$(NC)     🛑 fuser -k 8000/tcp"
	@echo "  $(GREEN)make status$(NC)   📊 Vérifie état"
	@echo "  $(GREEN)make convert$(NC)   convertie md"
	@echo "  $(GREEN)make help$(NC)     ❓ Cette aide"
	@echo ""
	@echo "$(YELLOW)💡 Ctrl+C arrête aussi le serveur$(NC)"
