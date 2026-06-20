#!/bin/bash
# Double-clique ce fichier pour lancer ACHIEVE.
# Laisse cette fenêtre ouverte tant que tu utilises l'app sur ton téléphone.
cd "$(dirname "$0")"
echo "Démarrage d'ACHIEVE… (ferme cette fenêtre ou Ctrl+C pour arrêter)"
node server.mjs --port 4321
