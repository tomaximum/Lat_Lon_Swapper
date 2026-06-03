# GPX Lat/Lon Swapper

Un outil web simple, rapide et privé pour inverser toutes les latitudes et longitudes dans un fichier GPX.

Ce problème survient parfois lors de l'export de traces GPS depuis certains logiciels où les coordonnées de latitude et longitude sont accidentellement inversées (par exemple, la latitude se retrouve dans le champ longitude et vice versa), plaçant vos tracés à des endroits erronés sur le globe (souvent au milieu de l'océan ou dans l'hémisphère opposé).

## Caractéristiques

- **100% Client-Side (Privé & Sécurisé) :** Vos fichiers GPX ne sont jamais téléchargés sur un serveur tiers. Tout le traitement d'inversion s'effectue localement dans votre propre navigateur.
- **Interface Moderne et Fluide :** Un design sombre (Dark Mode) avec effet de verre (Glassmorphic) et des animations réactives.
- **Drag & Drop :** Glissez et déposez simplement votre fichier GPX pour le charger.
- **Statistiques & Aperçu :** Affiche le nombre de points modifiés et compare les coordonnées du premier point (Original vs Inversé) avant et après l'opération.
- **Téléchargement Automatique :** Le fichier modifié est généré et proposé en téléchargement instantanément.

## Comment l'utiliser

### Méthode 1 : Ouverture directe (Simple)
Double-cliquez simplement sur le fichier `index.html` pour l'ouvrir dans n'importe quel navigateur moderne.

### Méthode 2 : Serveur Local (Recommandé)
Si vous souhaitez le faire tourner via un serveur web local, vous pouvez exécuter la commande suivante (si Python est installé) :

```bash
python -m http.server 8000
```

Ensuite, ouvrez votre navigateur et accédez à l'adresse suivante : [http://localhost:8000](http://localhost:8000)

## Comment fonctionne l'inversion ?

L'application utilise l'API native `DOMParser` du navigateur pour analyser le fichier XML du GPX. 

Elle recherche tous les éléments qui contiennent les attributs `lat` et `lon` (tels que `<trkpt>`, `<wpt>`, et `<rtept>`), extrait leurs valeurs respectives, les permute, puis ré-enregistre les modifications dans un nouveau fichier XML via `XMLSerializer`.

Ce procédé garantit que la structure complète du fichier (métadonnées, altitudes `<ele>`, horodatages `<time>`, etc.) reste intacte sans risque de corrompre l'encodage ou la sémantique du fichier GPX.
