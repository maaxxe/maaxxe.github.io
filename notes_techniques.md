# Notes techniques et Administration

Ce document regroupe les procédures techniques pour la maintenance du portfolio, la gestion du serveur local et l'utilisation des périphériques d'acquisition vidéo.

---

## 1. Gestion du Serveur Web Local

Pour tester le site en local sans passer par GitHub Pages, utilisez un serveur HTTP simple.

### Lancement du serveur
```bash
# Lance un serveur sur le port 8000 (accessible via http://localhost:8000)
python3 -m http.server 8000
```

### Arrêt du serveur (Libération du port)
Si le port est déjà utilisé ou si vous souhaitez arrêter le serveur proprement :
```bash
# Identifie et tue le processus utilisant le port 8000
fuser -k 8000/tcp
```

---

## 2. Configuration des Périphériques Vidéo (V4L2)

L'acquisition vidéo sous Linux s'appuie sur l'interface **Video4Linux2 (V4L2)**.

### Identification des caméras
```bash
# Liste tous les périphériques vidéo connectés
ls /dev/video*
```

### Exploration des capacités
Pour connaître les formats (MJPG, YUYV) et les résolutions supportés par une caméra spécifique (ex: `/dev/video4`) :
```bash
# Commande pour lister les formats et résolutions
v4l2-ctl -d /dev/video4 --list-formats-ext
```

---

## 3. Capture d'Images (fswebcam)

`fswebcam` est un outil léger pour capturer des clichés via la ligne de commande.

### Capture standard
```bash
fswebcam -d /dev/video4 photo.jpg
```

### Capture optimisée (HD & Sans bannière)
```bash
fswebcam -d /dev/video4 --no-banner -r 1280x720 photo.jpg
```

**Détails des options :**
- `-d /dev/videoX` : Définit le périphérique source.
- `--no-banner` : Supprime le bandeau de texte (date/heure) en bas de l'image.
- `-r 1280x720` : Force une résolution spécifique (HD).
- `-D 1` : Active le mode **Debug** pour voir les détails de l'initialisation du capteur.

---

## 4. Flux Vidéo en Direct (ffplay)

Pour visualiser le flux d'une caméra en temps réel, utilisez `ffplay` (inclus dans la suite `ffmpeg`).

### Installation (si nécessaire)
```bash
sudo apt update && sudo apt install ffmpeg
```

### Lancement du flux
```bash
# Affiche le flux de la caméra 4
ffplay -f v4l2 -i /dev/video4
```

---

## 5. Dépannage (Troubleshooting)

### Problème de permissions
Si vous ne pouvez pas accéder à `/dev/video*`, ajoutez votre utilisateur au groupe `video` :
```bash
sudo usermod -aG video $USER
# Redémarrez votre session pour appliquer les changements
```

### Port 8000 déjà utilisé
Si `python3 -m http.server` échoue :
1. Vérifiez s'il reste un résidu de serveur avec `ps aux | grep http.server`.
2. Libérez le port avec `fuser -k 8000/tcp`.

### Visualisation des photos
Pour ouvrir rapidement la photo capturée sous Linux :
```bash
xdg-open photo.jpg
```

---
*Dernière mise à jour : Avril 2026*
