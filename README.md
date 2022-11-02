# Applet Cinnamon TeleInfo

Applet Cinnamon permettant d'afficher la puissance apparente (PAPP) instantanée du compteur Linky.

Utilise le projet suivant pour récupérer la donnée JSON du compteur : https://github.com/rene-d/wifinfo

## Installation

Copy `tic@agoeurysky` folder in `~/.local/share/cinnamon/applets`.

## Configuration

2 paramètres sont à configurer :

* Update interval : 2 secondes par défaut
* URI to json : URI pour récupérer le json contenant la donnée PAPP du compteur.

## Lancer le debugger Cinnamon

`ALT+F2` et saisir `lg`