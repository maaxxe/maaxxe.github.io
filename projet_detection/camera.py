import cv2

def lancer_camera(numero_camera=2):
    # Spécifie le backend V4L2 et utilise le chemin du device
    cap = cv2.VideoCapture(f'/dev/video{numero_camera}', cv2.CAP_V4L2)
    
    if not cap.isOpened():
        print(f"Erreur : Impossible d'ouvrir /dev/video{numero_camera}")
        return
    
    # Configure la résolution (optionnel, aide parfois)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    print("Caméra lancée. Appuyez sur 'q' pour quitter.")
    
    while True:
        ret, frame = cap.read()
        
        if not ret:
            print("Erreur : Impossible de recevoir une image de la caméra.")
            break
        
        cv2.imshow('Flux vidéo de la caméra', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    lancer_camera(4)

    lancer_camera(3)

