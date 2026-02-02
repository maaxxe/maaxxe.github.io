# maaxxe.github.io


# lancer serveur 

python3 -m http.server 8000

# Kill serveur 

fuser -k 8000/tcp


# faire fonctionner la camera 

1) chercher la camera 
ls /dev/video*




sudo apt install ffmpeg
ffplay /dev/video0


# prendre photo 

fswebcam -D 1 -d /dev/video4 photo.jpg
//
-D 1 : Active le mode débogage (niveau 1). Cela affiche des informations détaillées sur la capture dans le terminal (par exemple, les paramètres de la caméra, les erreurs éventuelles, etc.).
-d /dev/video4 : Spécifie le périphérique vidéo à utiliser.
photo.jpg : Nom du fichier de sortie.
Résolution par défaut : fswebcam utilise une résolution basse par défaut (souvent 320x240 ou 640x480).

//
fswebcam -d /dev/video4 --no-banner -r 1280x720 photo.jpg
//
-d /dev/video4 : Spécifie le périphérique vidéo à utiliser.
--no-banner : Supprime la bannière avec la date et l'heure qui est ajoutée par défaut en bas de l'image.
-r 1280x720 : Définit la résolution de la photo à 1280x720 (HD). Cela améliore la qualité de l'image.
photo.jpg : Nom du fichier de sortie.

//

formats possible :v4l2-ctl -d /dev/video4 --list-formats-ext
//
[0]: 'MJPG' (Motion-JPEG, compressed)
		Size: Discrete 1280x720
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 960x540
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 640x480
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 640x360
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 320x240
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 320x180
			Interval: Discrete 0.033s (30.000 fps)
	[1]: 'YUYV' (YUYV 4:2:2)
		Size: Discrete 1280x720
			Interval: Discrete 0.100s (10.000 fps)
		Size: Discrete 960x540
			Interval: Discrete 0.050s (20.000 fps)
		Size: Discrete 640x480
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 640x360
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 320x240
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 320x180
			Interval: Discrete 0.033s (30.000 fps)
//

# voir photo

xdg-open photo.jpg

# video en direct 

ffplay -f v4l2 -i /dev/video4

