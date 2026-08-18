# Site restaurant — GitHub Pages + administration visuelle

Projet sans framework, prévu pour un restaurateur qui n'a jamais besoin d'utiliser Git.

## Ce qui est déjà inclus

- Page publique responsive avec les menus selon les jours.
- Affichage configurable de **1 à 14 jours**.
- Pour chaque jour : **fermé**, **midi**, **soir** ou **midi + soir**.
- Bibliothèque d'**étiquettes** de plats.
- Création / modification / suppression d'une étiquette.
- Catégories : entrée, plat, dessert, boisson, accompagnement, autre.
- **Glisser-déposer** d'un plat vers le midi ou le soir du jour voulu.
- Prix et description facultatifs.
- Modification du nom, sous-titre, adresse et téléphone du restaurant.
- Import / export JSON.
- Bouton **Publier** avec confirmation.
- Prévisualisation immédiate dans le navigateur.
- Worker Cloudflare fourni pour transformer **Publier → commit GitHub automatique** sans exposer le token GitHub.

## Tester le site localement

Depuis le dossier du projet :

```bash
python3 -m http.server 8000
```

Ouvrir ensuite :

- Site : `http://localhost:8000/`
- Administration : `http://localhost:8000/admin.html`

Les modifications sont enregistrées dans le stockage local du navigateur pendant le développement.

## Mettre le site sur GitHub Pages

1. Créer un dépôt, par exemple `restaurant-le-bistrot`.
2. Mettre les fichiers du projet à la racine du dépôt.
3. Ouvrir **Settings → Pages** dans GitHub.
4. Choisir le déploiement depuis la branche `main`, dossier `/root`.
5. Le site public sera disponible avec GitHub Pages.

## Activer le vrai bouton Publier

GitHub Pages est statique : un token GitHub ne doit jamais être enregistré dans `admin.js` ou `config.js`.

Le dossier `worker/` contient donc un petit Cloudflare Worker. Il reçoit le JSON et met à jour `data/menu.json` via l'API GitHub. L'API GitHub de mise à jour de fichier nécessite le contenu en Base64 ainsi que le SHA du fichier existant ; un token finement limité peut recevoir uniquement la permission `Contents: write` sur ce dépôt.

### Configuration du Worker

Dans `worker/wrangler.jsonc.example`, remplacer :

- `GITHUB_OWNER` : compte GitHub, ex. `maaxxe`
- `GITHUB_REPO` : dépôt du restaurant
- `GITHUB_BRANCH` : généralement `main`
- `ALLOWED_ORIGIN` : origine du site, par ex. `https://maaxxe.github.io`

Les valeurs sensibles doivent rester dans les **secrets Cloudflare** :

- `GITHUB_TOKEN` : fine-grained GitHub token limité au dépôt du restaurant, avec `Contents: Read and write`
- `ADMIN_PASSWORD` : mot de passe choisi pour le restaurateur

Une fois le Worker déployé, copier son URL dans `config.js` :

```js
window.RESTAURANT_ADMIN_CONFIG = {
  publishEndpoint: "https://restaurant-menu-publisher.VOTRE-COMPTE.workers.dev/publish"
};
```

Le fonctionnement devient alors :

`admin.html → Confirmer → Worker → data/menu.json → commit GitHub → GitHub Pages`

## Structure

```text
restaurant-site/
├── index.html
├── admin.html
├── styles.css
├── app.js
├── admin.js
├── config.js
├── data/
│   └── menu.json
└── worker/
    ├── worker.js
    ├── wrangler.jsonc.example
    └── .gitignore
```
