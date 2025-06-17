# ACRCloud Proxy Server

Ce serveur permet d'interagir avec l'API d'identification audio de ACRCloud depuis une app mobile (comme Expo).

## 🔧 Déploiement

1. Crée un compte sur [https://render.com](https://render.com)
2. Clique sur "New Web Service"
3. Uploade ce projet
4. Renseigne les variables d'environnement :
   - `ACR_ACCESS_KEY`
   - `ACR_ACCESS_SECRET`

## 🎧 Utilisation

Endpoint : `POST /identify`
- Paramètre `audio` (form-data): un fichier `.wav`

## ✅ Réponse

Retourne les métadonnées du son reconnu (titre, artiste, etc.).