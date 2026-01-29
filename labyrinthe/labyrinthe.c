#include <emscripten.h>
#include <stdlib.h>
#include <time.h>

#define LARGEUR 21
#define HAUTEUR 21

// 0 = mur, 1 = chemin, 2 = joueur, 3 = sortie
static int grille[HAUTEUR][LARGEUR];
static int joueur_x = 1;
static int joueur_y = 1;
static double temps_debut = 0;
static double meilleur_temps = 999999;
static int chrono_demarre = 0;

// Initialiser le générateur aléatoire
EMSCRIPTEN_KEEPALIVE
void initialiser() {
    srand(time(NULL));
}

// Obtenir le temps actuel en secondes
EMSCRIPTEN_KEEPALIVE
double obtenir_temps_actuel() {
    return emscripten_get_now() / 1000.0;
}

// Démarrer le chronomètre
EMSCRIPTEN_KEEPALIVE
void demarrer_chrono() {
    if (!chrono_demarre) {
        temps_debut = obtenir_temps_actuel();
        chrono_demarre = 1;
    }
}

// Obtenir le temps écoulé
EMSCRIPTEN_KEEPALIVE
double obtenir_temps_ecoule() {
    if (!chrono_demarre) return 0;
    return obtenir_temps_actuel() - temps_debut;
}

// Obtenir le meilleur temps
EMSCRIPTEN_KEEPALIVE
double obtenir_meilleur_temps() {
    return meilleur_temps;
}

// Mettre à jour le meilleur temps
EMSCRIPTEN_KEEPALIVE
void mettre_a_jour_meilleur_temps(double temps) {
    if (temps < meilleur_temps) {
        meilleur_temps = temps;
    }
}

// Réinitialiser le meilleur temps
EMSCRIPTEN_KEEPALIVE
void reinitialiser_meilleur_temps() {
    meilleur_temps = 999999;
}

// Vérifier si le chrono est démarré
EMSCRIPTEN_KEEPALIVE
int chrono_est_demarre() {
    return chrono_demarre;
}

// Générer un labyrinthe avec l'algorithme DFS
void generer_labyrinthe_recursif(int x, int y) {
    int directions[4][2] = {{0, -2}, {2, 0}, {0, 2}, {-2, 0}};
    
    // Mélanger les directions
    for (int i = 0; i < 4; i++) {
        int j = rand() % 4;
        int temp_x = directions[i][0];
        int temp_y = directions[i][1];
        directions[i][0] = directions[j][0];
        directions[i][1] = directions[j][1];
        directions[j][0] = temp_x;
        directions[j][1] = temp_y;
    }
    
    // Essayer chaque direction
    for (int i = 0; i < 4; i++) {
        int nx = x + directions[i][0];
        int ny = y + directions[i][1];
        
        if (nx > 0 && nx < LARGEUR - 1 && ny > 0 && ny < HAUTEUR - 1 && grille[ny][nx] == 0) {
            grille[ny][nx] = 1;
            grille[y + directions[i][1] / 2][x + directions[i][0] / 2] = 1;
            generer_labyrinthe_recursif(nx, ny);
        }
    }
}

EMSCRIPTEN_KEEPALIVE
void generer_labyrinthe() {
    // Initialiser avec des murs
    for (int y = 0; y < HAUTEUR; y++) {
        for (int x = 0; x < LARGEUR; x++) {
            grille[y][x] = 0;
        }
    }
    
    // Position de départ
    joueur_x = 1;
    joueur_y = 1;
    grille[joueur_y][joueur_x] = 1;
    
    // Générer le labyrinthe
    generer_labyrinthe_recursif(joueur_x, joueur_y);
    
    // Placer la sortie
    grille[HAUTEUR - 2][LARGEUR - 2] = 3;
    
    // Réinitialiser le chronomètre (mais ne pas le démarrer)
    chrono_demarre = 0;
    temps_debut = 0;
}

EMSCRIPTEN_KEEPALIVE
int obtenir_case(int x, int y) {
    if (x < 0 || x >= LARGEUR || y < 0 || y >= HAUTEUR) {
        return 0;
    }
    if (x == joueur_x && y == joueur_y) {
        return 2; // Joueur
    }
    return grille[y][x];
}

EMSCRIPTEN_KEEPALIVE
int deplacer(char direction) {
    int nouveau_x = joueur_x;
    int nouveau_y = joueur_y;
    
    switch (direction) {
        case 'z': nouveau_y--; break; // Haut
        case 's': nouveau_y++; break; // Bas
        case 'q': nouveau_x--; break; // Gauche
        case 'd': nouveau_x++; break; // Droite
    }
    
    // Vérifier si le déplacement est valide
    if (nouveau_x >= 0 && nouveau_x < LARGEUR && 
        nouveau_y >= 0 && nouveau_y < HAUTEUR && 
        grille[nouveau_y][nouveau_x] != 0) {
        
        // Démarrer le chrono au premier déplacement
        if (!chrono_demarre) {
            demarrer_chrono();
        }
        
        joueur_x = nouveau_x;
        joueur_y = nouveau_y;
        
        // Vérifier si le joueur a atteint la sortie
        if (grille[joueur_y][joueur_x] == 3) {
            double temps_final = obtenir_temps_ecoule();
            mettre_a_jour_meilleur_temps(temps_final);
            return 1; // Victoire !
        }
    }
    
    return 0;
}

EMSCRIPTEN_KEEPALIVE
int obtenir_largeur() {
    return LARGEUR;
}

EMSCRIPTEN_KEEPALIVE
int obtenir_hauteur() {
    return HAUTEUR;
}
