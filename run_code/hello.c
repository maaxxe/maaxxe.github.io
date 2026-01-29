#include <stdio.h>
#include <emscripten.h>

// Fonction qui sera appelée depuis JavaScript
EMSCRIPTEN_KEEPALIVE
int calculer(int a, int b) {
    return a + b;
}

EMSCRIPTEN_KEEPALIVE
void afficherMessage() {
    printf("Bonjour depuis le code C!\n");
}

EMSCRIPTEN_KEEPALIVE
int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}
