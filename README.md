# ACHIEVE — *Achieve your dream*

Application web de préparation physique personnelle pour la **sélection pilote ALAT**
(Aviation Légère de l'Armée de Terre — hélicoptères). Mobile-first, installable comme
une app (**PWA**), **utilisable hors-ligne**, avec **toutes les données stockées en local
sur l'appareil** (aucun serveur, aucune fuite de données).

Univers visuel : **aviation militaire française**, du Rafale au Tigre/NH90 Caïman de l'ALAT.
Chaque pilier d'entraînement est incarné par un appareil ; le récit culmine sur la
destination : le 5ᵉ RHC de Pau.

---

## Ce que fait l'app

Navigation par **barre d'onglets basse** (4 onglets, tout à un tap) :
**Poste de pilotage · Ravitaillement · Plan de vol · Suivi**. Au premier lancement,
une intro cinématique s'affiche une fois, puis l'app ouvre toujours directement sur le
**Poste de pilotage** (cf. `start_url` du manifest).

- **Accueil / intro** scrollytelling cinématique (hero plein cadre, parallaxe, plan de vol qui se trace).
- **Aujourd'hui (Poste de pilotage)** : que faire aujourd'hui, compte à rebours du concours, macros du jour, conseil les jours de travail.
- **Planning (Plan de vol)** : carte de navigation 6 mois (route + « tu es ici ») puis vues
  Jour / Semaine / Mois / 6 mois / Année. Ouvre sur aujourd'hui. Cases colorées
  (vert = réalisée, rouge = manquée, gris = repos/à venir, aujourd'hui encadré).
  La **progression sur la route est pilotée par l'assiduité réelle** (séances réalisées /
  prévues) : le repère avance quand tu t'entraînes et reste en arrière si tu sautes des séances.
  **Jours de travail** marquables (dispo réduite → le plan propose une séance courte/repos).
- **Séances** :
  - **Muscu** : 3 niveaux du jour (Fatigué / En forme / Pleine forme) qui ajustent les
    charges, RPE/RIR, **charges éditables et mémorisées**, cases « série faite »,
    **chronomètre** intégré, bouton **Valider**.
  - **Course** : segments avec **allures calculées depuis la VMA**, notes de prudence.
  - **Test** : demi-Cooper / tractions max / chaise — le demi-Cooper **met à jour la VMA**
    automatiquement (distance ÷ 100).
- **Nutrition (Ravitaillement)** : réservoirs de carburant qui se remplissent selon l'**apport
  loggé** (protéines / glucides / lipides / hydratation, % atteint par macro), checklist
  compléments (créatine, vit. D/C, oméga 3 — **pas de whey**).
- **Hangar** : galerie zoomable (pince, double-tap, glisse).
- **Suivi & réglages** : **jauges des 3 objectifs** (Tractions / Chaise / Luc Léger) qui
  progressent de la valeur précédente à l'actuelle (historique des tests), assiduité, courbe
  de poids, réglages (VMA / poids cible / date du concours), **export & import JSON**, réinitialisation.

---

## Stack technique

- **Vanilla HTML / CSS / JavaScript** (modules ES). **Aucun build, aucune dépendance** à
  installer pour faire tourner l'app : ce sont des fichiers statiques.
- Animations cinématiques de l'accueil via **GSAP + ScrollTrigger + Lenis** (vendorisés
  en local dans `js/vendor/`, chargés **uniquement** sur l'accueil, coupés si
  `prefers-reduced-motion`).
- Données utilisateur en **localStorage** (avec repli mémoire si indisponible).
- **PWA** : `manifest.webmanifest` + `service-worker.js` (cache app shell + polices +
  images → hors-ligne complet). Polices self-hostées (`fonts/`).

### Performance (Lighthouse mobile, build statique)

| Écran | Performance | Accessibilité |
|---|---|---|
| Accueil | 95 | 100 |
| Aujourd'hui | 98 | 100 |
| Planning | 95 | 96 |

JS applicatif ≈ 25 Ko gzip (+ 48 Ko de cinématique sur l'accueil seulement).

---

## Démarrer (pour développer / prévisualiser)

> Pré-requis : **Node.js 18+** (uniquement pour le petit serveur de dev ; l'app elle-même
> n'a aucune dépendance). Tu n'as **rien à installer** d'autre.

```bash
# 1) Lancer le serveur de développement
npm run dev
# → ouvre http://localhost:4321

# 2) Produire le build statique (copie dans /dist)
npm run build

# 3) Prévisualiser le build
npm run preview
# → ouvre http://localhost:4321
```

> Astuce : `npm run dev` n'installe rien. Si tu préfères sans Node, n'importe quel serveur
> statique sert le dossier (ex. `python3 -m http.server 4321`). Il faut servir via
> **http://** (pas en ouvrant le fichier directement) pour que le service worker et les
> modules ES fonctionnent.

### Déploiement (GitHub Pages — depuis la branche)

L'app est publiée en HTTPS sur **GitHub Pages** :

> **URL publique : https://poissonolann-ui.github.io/projet-alat/**

**Activation (une seule fois) :** sur GitHub, **Settings → Pages → Build and deployment**,
choisis **Source : « Deploy from a branch »**, branche **`main`**, dossier **`/ (root)`**, puis
**Save**. (Le fichier `.nojekyll` à la racine dit à GitHub de servir les fichiers tels quels,
sans traitement Jekyll.)

**Redéployer après une modification :** il suffit de pousser sur `main` —
GitHub republie tout seul (~1 min).

```bash
git add -A && git commit -m "ma modif"
git push origin main          # → GitHub Pages se reconstruit automatiquement
```

> Le dépôt doit être **public** (Pages privé = plan payant). Tout est statique : tu peux aussi
> héberger le dossier ailleurs (Netlify, Vercel, Cloudflare Pages, un simple serveur HTTP) —
> aucun backend requis.

---

## Installer sur iPhone (écran d'accueil, hors-ligne)

1. Ouvre **https://poissonolann-ui.github.io/projet-alat/** dans **Safari** (sur ton iPhone).
2. Touche le bouton **Partager** (carré avec une flèche vers le haut).
3. Choisis **« Sur l'écran d'accueil »**.
4. Valide : l'icône **ACHIEVE** (jet tricolore) apparaît sur l'écran d'accueil.
5. Lance-la depuis l'icône : elle s'ouvre **en plein écran**, démarre instantanément, et
   fonctionne **hors-ligne** (le contenu est mis en cache à la première visite en ligne).

> Pour l'hors-ligne : ouvre l'app **une fois connecté** afin que le service worker mette en
> cache l'app shell, les polices et les images. Ensuite, plus besoin de réseau.

---

## Sauvegarde de tes données

Tout vit sur ton téléphone (localStorage). Pour ne rien perdre :

- **Suivi & réglages → Exporter** : télécharge un fichier `achieve-sauvegarde-AAAA-MM-JJ.json`.
- **Importer** : restaure depuis un fichier exporté.
- **Réinitialiser** : efface tout (avec confirmation).

---

## Modifier le contenu (sans être développeur)

Tout le contenu d'entraînement, la nutrition et les objectifs sont dans **`/data`** :

| Fichier | Contenu |
|---|---|
| `data/profile.js` | Profil, objectifs chiffrés, **VMA**, **date du concours**, poids cible |
| `data/exercises.js` | Exercices, **charges de référence**, pas, séries/reps, RPE/RIR |
| `data/weekTemplate.js` | Gabarit hebdomadaire (Lun → Dim) |
| `data/running.js` | Plan course (Bloc 1 détaillé, Bloc 2 placeholder) |
| `data/nutrition.js` | 3 journées types + compléments + conseils |
| `data/aircraft.js` | Association pilier ↔ appareil + textes |

Édite ces valeurs, recharge la page : c'est pris en compte.
La **date du concours**, la **VMA** et le **poids cible** sont aussi modifiables directement
dans l'écran **Suivi & réglages**.

---

## Tes photos d'appareils

- Place tes propres visuels (dont tu as les droits) dans **`aircraft/`**.
- Par défaut, des **silhouettes vectorielles SVG** (Rafale, Mirage 2000, Caïman, Tigre,
  MRTT) assurent un rendu complet **même sans photo**.
- Deux photos Rafale Solo Display (livrée tricolore) fournies sont déjà intégrées (hero +
  hangar), optimisées en WebP.

> ⚠️ N'utilise que des images dont tu as les droits (tes photos, visuels officiels avec
> mention si requise, ou banques libres de droits).

---

## Structure du projet

```
/                     pages HTML (index, today, planning, session, nutrition, hangar, tracking)
/css                  tokens, base, hud, app, home, hangar
/js                   app, menu, home, today, planning, session, nutrition, hangar, tracking
/js/lib               store (localStorage), pace (allures VMA), date, schedule, motion
/js/vendor            gsap, ScrollTrigger, lenis (accueil uniquement)
/data                 contenu modifiable (voir ci-dessus)
/aircraft             silhouettes SVG + photos
/icons                icônes PWA
/fonts                polices self-hostées (Saira / Saira Semi Condensed / JetBrains Mono)
manifest.webmanifest  manifeste PWA
service-worker.js     cache hors-ligne
server.mjs            serveur statique de dev/preview (zéro dépendance)
build.mjs             copie statique vers /dist
```

---

*Achieve your dream. ⊕ 48°34′N 4°45′W*
