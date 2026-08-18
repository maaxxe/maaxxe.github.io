# Chez Lucette — site et administration

Ce dossier est prévu pour être placé dans le dépôt `maaxxe/maaxxe.github.io` sous `Chez_Lucette/`.

## URLs

- Site : `https://maaxxe.github.io/Chez_Lucette/`
- Admin : `https://maaxxe.github.io/Chez_Lucette/admin.html`
- Worker : `https://chez-lucette-publisher.maaxxe.workers.dev`

## Publication automatique

L'admin envoie le menu au Cloudflare Worker. Le Worker met à jour :

`Chez_Lucette/data/menu.json`

dans le dépôt :

`maaxxe/maaxxe.github.io`

Le token GitHub et le mot de passe admin ne sont jamais présents dans le site. Ils doivent rester dans les secrets Cloudflare :

```bash
cd Chez_Lucette/worker
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put ADMIN_PASSWORD
npx wrangler deploy
```

Les secrets déjà enregistrés sur le Worker `chez-lucette-publisher` n'ont pas besoin d'être recréés lors d'un simple redéploiement.

## Mettre cette version dans le dépôt

Remplacer le contenu du dossier `Chez_Lucette` par celui de cette archive, en conservant votre vrai fichier `image/logo.jpg`, puis :

```bash
cd /home/max/Projets/maaxxe.github.io
git add Chez_Lucette
git commit -m "Fix publication Chez Lucette"
git push
```

Ensuite redéployer le Worker :

```bash
cd /home/max/Projets/maaxxe.github.io/Chez_Lucette/worker
npx wrangler deploy
```

L'admin affiche maintenant un badge `Worker connecté` quand le Worker répond.
