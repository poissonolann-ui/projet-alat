@echo off
rem Double-clique ce fichier pour lancer ACHIEVE.
rem Laisse cette fenetre ouverte tant que tu utilises l'app sur ton telephone.
cd /d "%~dp0"
echo Demarrage d'ACHIEVE... (ferme cette fenetre pour arreter)
node server.mjs --port 4321
pause
