#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

#define N 9
#define SRN 3

// Niveaux de difficulté
#define FACILE_K 35
#define MOYEN_K 45
#define DIFFICILE_K 55

int grid[N][N];
int solution[N][N];

// Vérifier si un nombre n'est pas utilisé dans le carré 3x3
int unUsedInBox(int rowStart, int colStart, int num) {
    for (int i = 0; i < SRN; i++)
        for (int j = 0; j < SRN; j++)
            if (grid[rowStart + i][colStart + j] == num)
                return 0;
    return 1;
}

// Vérifier si un nombre n'est pas utilisé dans la ligne
int unUsedInRow(int i, int num) {
    for (int j = 0; j < N; j++)
        if (grid[i][j] == num)
            return 0;
    return 1;
}

// Vérifier si un nombre n'est pas utilisé dans la colonne
int unUsedInCol(int j, int num) {
    for (int i = 0; i < N; i++)
        if (grid[i][j] == num)
            return 0;
    return 1;
}

// Vérifier si sûr de placer le nombre
int checkIfSafe(int i, int j, int num) {
    return (unUsedInRow(i, num) &&
            unUsedInCol(j, num) &&
            unUsedInBox(i - i % SRN, j - j % SRN, num));
}

// Remplir une boîte 3x3
void fillBox(int row, int col) {
    int num;
    for (int i = 0; i < SRN; i++) {
        for (int j = 0; j < SRN; j++) {
            do {
                num = (rand() % N) + 1;
            } while (!unUsedInBox(row, col, num));
            grid[row + i][col + j] = num;
        }
    }
}

// Remplir les 3 boîtes diagonales
void fillDiagonal() {
    for (int i = 0; i < N; i += SRN)
        fillBox(i, i);
}

// Remplir les cellules restantes
int fillRemaining(int i, int j) {
    if (j >= N && i < N - 1) {
        i++;
        j = 0;
    }
    if (i >= N && j >= N)
        return 1;
    
    if (i < SRN) {
        if (j < SRN)
            j = SRN;
    } else if (i < N - SRN) {
        if (j == (i / SRN) * SRN)
            j += SRN;
    } else {
        if (j == N - SRN) {
            i++;
            j = 0;
            if (i >= N)
                return 1;
        }
    }
    
    for (int num = 1; num <= N; num++) {
        if (checkIfSafe(i, j, num)) {
            grid[i][j] = num;
            if (fillRemaining(i, j + 1))
                return 1;
            grid[i][j] = 0;
        }
    }
    return 0;
}

// Retirer K chiffres pour créer le puzzle
void removeKDigits(int k) {
    int count = k;
    while (count != 0) {
        int cellId = rand() % (N * N);
        int i = cellId / N;
        int j = cellId % N;
        
        if (grid[i][j] != 0) {
            count--;
            grid[i][j] = 0;
        }
    }
}

// Copier la grille
void copyGrid(int src[N][N], int dest[N][N]) {
    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            dest[i][j] = src[i][j];
}

// Générer un Sudoku complet
void generateSudoku(int k) {
    // Remplir la diagonale
    fillDiagonal();
    
    // Remplir les cellules restantes
    fillRemaining(0, SRN);
    
    // Sauvegarder la solution
    copyGrid(grid, solution);
    
    // Retirer K chiffres
    removeKDigits(k);
}

// Lire le JSON existant et obtenir le dernier ID
int getLastPuzzleId(const char* filename) {
    FILE* file = fopen(filename, "r");
    if (!file) return 0;
    
    char line[1000];
    int lastId = 0;
    
    while (fgets(line, sizeof(line), file)) {
        if (strstr(line, "\"id\":")) {
            sscanf(line, " \"id\": %d", &lastId);
        }
    }
    
    fclose(file);
    return lastId;
}

// Ajouter un puzzle au JSON
void appendPuzzleToJSON(const char* filename, int puzzleId, const char* difficulty, int k) {
    FILE* file = fopen(filename, "r");
    char content[50000] = "";
    int isFirstPuzzle = 0;
    
    if (file) {
        // Lire tout le fichier
        fread(content, 1, sizeof(content), file);
        fclose(file);
        
        // Trouver la position avant le dernier ]
        char* lastBracket = strrchr(content, ']');
        if (lastBracket) {
            // Trouver le } avant le ]
            char* lastBrace = lastBracket - 1;
            while (lastBrace > content && *lastBrace != '}') lastBrace--;
            
            if (*lastBrace == '}') {
                *(lastBrace + 1) = '\0'; // Couper ici
            }
        }
    } else {
        // Nouveau fichier
        strcpy(content, "{\n  \"puzzles\": [\n");
        isFirstPuzzle = 1;
    }
    
    // Ouvrir en mode écriture
    file = fopen(filename, "w");
    if (!file) {
        printf("Erreur: impossible d'ouvrir %s\n", filename);
        return;
    }
    
    // Écrire le contenu existant
    fprintf(file, "%s", content);
    
    // Ajouter une virgule si ce n'est pas le premier puzzle
    if (!isFirstPuzzle && strlen(content) > 20) {
        fprintf(file, ",\n");
    }
    
    // Écrire le nouveau puzzle
    fprintf(file, "    {\n");
    fprintf(file, "      \"id\": %d,\n", puzzleId);
    fprintf(file, "      \"difficulty\": \"%s\",\n", difficulty);
    
    // Écrire la grille du puzzle
    fprintf(file, "      \"grid\": [\n");
    for (int i = 0; i < N; i++) {
        fprintf(file, "        [");
        for (int j = 0; j < N; j++) {
            fprintf(file, "%d", grid[i][j]);
            if (j < N - 1) fprintf(file, ",");
        }
        fprintf(file, "]");
        if (i < N - 1) fprintf(file, ",");
        fprintf(file, "\n");
    }
    fprintf(file, "      ],\n");
    
    // Écrire la solution
    fprintf(file, "      \"solution\": [\n");
    for (int i = 0; i < N; i++) {
        fprintf(file, "        [");
        for (int j = 0; j < N; j++) {
            fprintf(file, "%d", solution[i][j]);
            if (j < N - 1) fprintf(file, ",");
        }
        fprintf(file, "]");
        if (i < N - 1) fprintf(file, ",");
        fprintf(file, "\n");
    }
    fprintf(file, "      ]\n");
    fprintf(file, "    }\n");
    
    // Fermer le JSON
    fprintf(file, "  ]\n");
    fprintf(file, "}\n");
    
    fclose(file);
    printf("✓ Puzzle %d (%s, %d cases vides) ajouté\n", puzzleId, difficulty, k);
}

int main(int argc, char* argv[]) {
    srand(time(NULL));
    
    const char* filename = "sudoku.json";
    
    // NOMBRE DE PUZZLES À GÉNÉRER (modifie cette valeur)
    int numPuzzles = 19;  // Change ce nombre ici !
    
    // Ou garde la possibilité de passer en argument
    if (argc > 1) {
        numPuzzles = atoi(argv[1]);
    }
    
    printf("========================================\n");
    printf("   Générateur de Sudoku\n");
    printf("========================================\n\n");
    printf("Génération de %d puzzle(s)...\n\n", numPuzzles);
    
    printf("========================================\n");
    printf("   Générateur de Sudoku\n");
    printf("========================================\n\n");
    printf("Génération de %d puzzle(s)...\n\n", numPuzzles);
    
    // Obtenir le dernier ID
    int lastId = getLastPuzzleId(filename);
    printf("Dernier ID trouvé: %d\n\n", lastId);
    
    // Compter par difficulté pour répartition équitable
    int countFacile = 0;
    int countMoyen = 0;
    int countDifficile = 0;
    
    for (int p = 0; p < numPuzzles; p++) {
        // Réinitialiser la grille
        for (int i = 0; i < N; i++)
            for (int j = 0; j < N; j++)
                grid[i][j] = 0;
        
        // Répartition équitable des difficultés
        int k;
        const char* difficulty;
        
        // Cycle: facile -> moyen -> difficile -> facile...
        int diffLevel = p % 3;
        
        switch (diffLevel) {
            case 0:
                k = FACILE_K;  // 35 cases vides
                difficulty = "facile";
                countFacile++;
                break;
            case 1:
                k = MOYEN_K;   // 45 cases vides
                difficulty = "moyen";
                countMoyen++;
                break;
            case 2:
                k = DIFFICILE_K;  // 55 cases vides
                difficulty = "difficile";
                countDifficile++;
                break;
        }
        
        // Générer le Sudoku
        generateSudoku(k);
        
        // Ajouter au JSON
        appendPuzzleToJSON(filename, lastId + p + 1, difficulty, k);
    }
    
    printf("\n========================================\n");
    printf("✓ Génération terminée!\n");
    printf("========================================\n\n");
    printf("📊 Répartition:\n");
    printf("   🟢 Facile:     %d puzzle(s)\n", countFacile);
    printf("   🟡 Moyen:      %d puzzle(s)\n", countMoyen);
    printf("   🔴 Difficile:  %d puzzle(s)\n", countDifficile);
    printf("\n✓ Total: %d puzzle(s) ajouté(s) à %s\n\n", numPuzzles, filename);
    
    return 0;
}
