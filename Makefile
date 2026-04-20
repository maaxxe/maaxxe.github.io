# --- COULEURS ---
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m

.PHONY: all clean help build-all clean-all serve notes cal f1 lab

# Par défaut : affiche l'aide
help:
	@echo "$(YELLOW)--- Gestion Globale du Portfolio ---$(NC)"
	@echo "  $(GREEN)make all$(NC)      : Compile tous les sous-projets (WASM, Calendriers, etc.)"
	@echo "  $(GREEN)make clean$(NC)    : Nettoie tous les fichiers générés et arrête les serveurs"
	@echo "  $(GREEN)make serve$(NC)    : Lance un serveur local sur le port 8000 pour tout le site"
	@echo ""
	@echo "  $(YELLOW)[ PROJETS INDIVIDUELS ]$(NC)"
	@echo "  $(GREEN)make notes$(NC)     : Lancer le Bloc-notes (Port 8000)"
	@echo "  $(GREEN)make cal$(NC)       : Lancer le Calendrier Scolaire (Port 8000)"
	@echo "  $(GREEN)make f1$(NC)        : Lancer le Calendrier F1 (Port 8001)"
	@echo "  $(GREEN)make lab$(NC)       : Lancer le Jeu du Labyrinthe (Port 8000)"
	@echo ""
	@echo "$(YELLOW)Sous-modules gérés :$(NC)"
	@echo "  - Bloc-notes (Markdown -> HTML)"
	@echo "  - Calendrier (Scolaire & F1)"
	@echo "  - Labyrinthe (C -> WebAssembly)"

# Compilation de tous les projets
all:
	@echo "$(YELLOW)Compilation globale en cours...$(NC)"
	@echo "$(GREEN)[1/3] Bloc-notes...$(NC)"
	@make -C Bloc-notes convert
	@echo "$(GREEN)[2/3] Calendrier (Scolaire & F1)...$(NC)"
	@make -C calendrier all
	@echo "$(GREEN)[3/3] Labyrinthe (WebAssembly)...$(NC)"
	@make -C labyrinthe all || echo "$(RED)Erreur compilation Labyrinthe (Vérifiez Emscripten)$(NC)"
	@echo "$(YELLOW)Tout est prêt !$(NC)"

# Nettoyage de tous les projets
clean:
	@echo "$(RED)Nettoyage global...$(NC)"
	@make -C Bloc-notes clean
	@make -C calendrier cleanall
	@make -C labyrinthe clean
	@fuser -k 8000/tcp 2>/dev/null || true
	@echo "$(YELLOW)Système propre.$(NC)"

# Lancement du serveur racine pour tester tout le site
serve:
	@echo "$(YELLOW)Lancement du serveur global sur http://localhost:8000$(NC)"
	@python3 -m http.server 8000

# --- PROJETS INDIVIDUELS ---

notes:
	@make -C Bloc-notes serve

cal:
	@make -C calendrier serve

f1:
	@make -C calendrier servef1

lab:
	@make -C labyrinthe serve
