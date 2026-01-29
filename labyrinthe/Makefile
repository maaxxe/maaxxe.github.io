# ==================== CONFIGURATION ====================

EMSDK_PATH = $(HOME)/Git/Vide/emsdk
EMSDK_ENV = $(EMSDK_PATH)/emsdk_env.sh

CC = emcc
PROJECT = labyrinthe
SRC = $(PROJECT).c
OUT_JS = $(PROJECT).js
OUT_WASM = $(PROJECT).wasm

CFLAGS = -s WASM=1 \
         -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
         -s EXPORTED_FUNCTIONS='["_initialiser","_generer_labyrinthe","_obtenir_case","_deplacer","_obtenir_largeur","_obtenir_hauteur","_obtenir_temps_ecoule","_obtenir_meilleur_temps","_reinitialiser_meilleur_temps","_chrono_est_demarre"]'

DEBUG_FLAGS = -g -O0 -s ASSERTIONS=1
RELEASE_FLAGS = -O3

# ==================== CIBLES ====================

all: $(OUT_JS)

$(OUT_JS): $(SRC)
	@echo "Compilation de $(SRC)..."
	@bash -c "source $(EMSDK_ENV) && $(CC) $(SRC) -o $(OUT_JS) $(CFLAGS)"
	@echo "Compilation terminée: $(OUT_JS) et $(OUT_WASM)"

debug: $(SRC)
	@echo "Compilation en mode DEBUG..."
	@bash -c "source $(EMSDK_ENV) && $(CC) $(SRC) -o $(OUT_JS) $(CFLAGS) $(DEBUG_FLAGS)"
	@echo "Compilation DEBUG terminée"

release: $(SRC)
	@echo "Compilation en mode RELEASE..."
	@bash -c "source $(EMSDK_ENV) && $(CC) $(SRC) -o $(OUT_JS) $(CFLAGS) $(RELEASE_FLAGS)"
	@echo "Compilation RELEASE terminée"

clean:
	@echo "Nettoyage des fichiers générés..."
	rm -f $(OUT_JS) $(OUT_WASM)
	@echo "Nettoyage terminé"

rebuild: clean all

serve: all
	@echo "Lancement du serveur sur http://localhost:8000"
	@echo "Ouvrez http://localhost:8000/$(PROJECT).html dans votre navigateur"
	python3 -m http.server 8000

check:
	@echo "Vérification de l'environnement..."
	@bash -c "source $(EMSDK_ENV) && which emcc > /dev/null && echo 'Emscripten est disponible' || echo 'Emscripten non trouvé'"
	@bash -c "source $(EMSDK_ENV) && emcc --version" 2>/dev/null || echo "Erreur de chargement d'Emscripten"

deploy: release
	@echo "Déploiement sur GitHub..."
	git add $(SRC) $(OUT_JS) $(OUT_WASM) $(PROJECT).html $(PROJECT).css Makefile
	git commit -m "Mise à jour du jeu du labyrinthe"
	git push origin main
	@echo "Déploiement terminé"

help:
	@echo "Commandes disponibles:"
	@echo "  make          - Compiler le projet"
	@echo "  make debug    - Compiler en mode debug"
	@echo "  make release  - Compiler en mode optimisé"
	@echo "  make clean    - Supprimer les fichiers générés"
	@echo "  make rebuild  - Nettoyer et recompiler"
	@echo "  make serve    - Compiler et lancer un serveur local"
	@echo "  make check    - Vérifier l'environnement"
	@echo "  make deploy   - Compiler et déployer sur GitHub"
	@echo "  make help     - Afficher cette aide"

.PHONY: all debug release clean rebuild serve check deploy help
