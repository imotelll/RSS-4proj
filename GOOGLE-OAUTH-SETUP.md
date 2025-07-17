# Configuration Google OAuth pour SUPRSS

## URLs de callback à ajouter dans Google Cloud Console

Vous devez ajouter ces URLs dans votre projet Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs :

### Environnement de développement local
```
http://localhost:5000/api/auth/google/callback
```

### Environnement de production
```
https://4proj.lpasr.fr/api/auth/google/callback
```

## Instructions détaillées

1. **Allez sur Google Cloud Console** : https://console.cloud.google.com/
2. **Sélectionnez votre projet** (ou créez-en un nouveau)
3. **Activez l'API Google OAuth2** :
   - Allez dans "APIs & Services" > "Library"
   - Recherchez "Google+ API" ou "People API"
   - Cliquez sur "Enable"

4. **Créez des identifiants OAuth 2.0** :
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choisissez "Web application"
   - Donnez un nom à votre client

5. **Ajoutez les URLs de redirection autorisées** :
   - Dans la section "Authorized redirect URIs"
   - Ajoutez : `http://localhost:5000/api/auth/google/callback`
   - Ajoutez : `https://4proj.lpasr.fr/api/auth/google/callback`

6. **Copiez vos identifiants** :
   - Client ID : `95894184226-2rc081q8g3ibfs9sirogbjd6jb6s387v.apps.googleusercontent.com`
   - Client Secret : `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`

## Configuration dans l'application

Les identifiants sont déjà configurés dans le fichier `.env` :

```env
GOOGLE_CLIENT_ID=95894184226-2rc081q8g3ibfs9sirogbjd6jb6s387v.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://4proj.lpasr.fr/api/auth/google/callback
```

## Test de l'authentification

Une fois les URLs ajoutées dans Google Cloud Console :

1. **Développement local** : Testez sur http://localhost:5000
2. **Production** : Testez sur https://4proj.lpasr.fr

L'authentification Google devrait fonctionner sur les deux environnements.