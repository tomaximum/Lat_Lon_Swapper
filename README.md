# GPX Lat/Lon Swapper

Un outil web simple, rapide et privé pour inverser toutes les latitudes et longitudes dans vos fichiers GPX.

Ce problème survient parfois lors de l'export de traces GPS depuis certains logiciels où les coordonnées de latitude et longitude sont accidentellement inversées (par exemple, la latitude se retrouve dans le champ longitude et vice versa), plaçant vos tracés à des endroits erronés sur le globe (souvent au milieu de l'océan ou dans l'hémisphère opposé).

## Caractéristiques

- **Traitement par Lot (Nouveau) :** Glissez-déposez et traitez **plusieurs fichiers GPX simultanément**. L'application gère le traitement de tous les fichiers et lance leurs téléchargements respectifs en un seul clic.
- **100% Client-Side (Privé & Sécurisé) :** Vos fichiers GPX ne sont jamais téléchargés sur un serveur tiers. Tout le traitement d'inversion s'effectue localement dans votre propre navigateur.
- **Interface Moderne et Fluide :** Un design sombre (Dark Mode) avec effet de verre (Glassmorphic) et des animations réactives.
- **Gestion de liste interactive :** Visualisez les fichiers chargés avec leurs tailles individuelles, et retirez facilement des fichiers de la liste avant de lancer l'inversion.
- **Statistiques & Aperçu :** Affiche le nombre total de fichiers et de points modifiés, et affiche un comparatif avant/après des coordonnées du premier point.

## Comment l'utiliser

### Méthode 1 : En ligne (Recommandé)
L'application est disponible publiquement sur GitHub Pages :
👉 **[https://tomaximum.github.io/Lat_Lon_Swapper/](https://tomaximum.github.io/Lat_Lon_Swapper/)**

### Méthode 2 : Ouverture directe locale
Double-cliquez simplement sur le fichier `index.html` pour l'ouvrir dans n'importe quel navigateur moderne.

### Méthode 3 : Serveur Local
Si vous souhaitez le faire tourner via un serveur web local, vous pouvez exécuter la commande suivante (si Python est installé) :

```bash
python -m http.server 8000
```
Ensuite, accédez à : [http://localhost:8000](http://localhost:8000)

## Note sur les téléchargements multiples
Puisque l'application génère et télécharge un fichier corrigé par fichier fourni, votre navigateur affichera une alerte de sécurité du type : *"Autoriser ce site à télécharger plusieurs fichiers ?"*. 
**Vous devez accepter/autoriser cette demande** pour que tous vos fichiers modifiés soient téléchargés.

## Comment fonctionne l'inversion ?

L'application utilise l'API native `DOMParser` du navigateur pour analyser le fichier XML du GPX. 

Elle recherche tous les éléments qui contiennent les attributs `lat` et `lon` (tels que `<trkpt>`, `<wpt>`, et `<rtept>`), extrait leurs valeurs respectives, les permute, puis ré-enregistre les modifications dans un nouveau fichier XML via `XMLSerializer`.

Ce procédé garantit que la structure complète du fichier (métadonnées, altitudes `<ele>`, horodatages `<time>`, etc.) reste intacte sans risque de corrompre l'encodage ou la sémantique du fichier GPX.
