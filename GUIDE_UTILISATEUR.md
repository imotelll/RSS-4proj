# Guide d'utilisation SUPRSS

## Démarrage rapide

### 1. Connexion à l'application

Vous pouvez vous connecter de plusieurs façons :
- **Email et mot de passe** : Créez un compte avec votre adresse email
- **Google** : Connexion rapide avec votre compte Google
- **Facebook** : Connexion avec votre compte Facebook
- **Replit** : Si vous utilisez Replit, connexion automatique

### 2. Interface principale

Une fois connecté, vous accédez au tableau de bord principal avec :
- **Flux RSS** : Liste des flux disponibles
- **Articles** : Articles récents de tous les flux
- **Favoris** : Vos articles sauvegardés
- **Collections** : Espaces collaboratifs

## Gestion des flux RSS

### Ajouter un nouveau flux
1. Cliquez sur "Ajouter un flux" dans la section RSS
2. Entrez l'URL du flux RSS (ex: https://example.com/rss.xml)
3. Le système vérifie automatiquement la validité du flux
4. Le flux est ajouté et partagé avec tous les utilisateurs

### Flux disponibles par défaut
- **CERT-FR (ANSSI)** : Alertes de sécurité informatique
- **Wired** : Actualités technologiques
- **Numerama** : News tech et numérique
- **ZATAZ** : Sécurité informatique
- **Le Monde** : Actualités générales

## Lecture des articles

### Navigation
- **Liste des articles** : Tous les articles récents
- **Filtrage par flux** : Sélectionnez un flux spécifique
- **Recherche** : Recherchez dans le contenu des articles
- **Statut lu/non-lu** : Suivi automatique de votre lecture

### Actions sur les articles
- **Marquer comme lu** : Clic sur l'article
- **Ajouter aux favoris** : Bouton étoile
- **Partager** : Lien direct vers l'article
- **Commenter** : Dans les collections collaboratives

## Collections collaboratives

### Créer une collection
1. Accédez à la section "Collections"
2. Cliquez sur "Nouvelle collection"
3. Donnez un nom et une description
4. Invitez des membres par email

### Permissions des rôles
- **Propriétaire** : Tous les droits, gestion des membres
- **Modérateur** : Gestion du contenu, modération des commentaires
- **Membre** : Lecture, commentaires, ajout d'articles
- **Lecture seule** : Consultation uniquement

### Chat en temps réel
- Messagerie intégrée dans chaque collection
- Notifications instantanées
- Partage d'articles directement dans le chat

## Personnalisation

### Thème
- **Thème clair** : Interface blanche classique
- **Thème sombre** : Interface sombre pour les yeux
- Basculement automatique selon les préférences système

### Notifications
- Nouveaux articles dans vos flux favoris
- Messages dans les collections
- Mentions dans les commentaires
- Invitations à rejoindre des collections

## Fonctionnalités temps réel

### Synchronisation automatique
- Les flux RSS se mettent à jour toutes les 30 minutes
- Nouveaux articles visibles instantanément
- Compteurs mis à jour en temps réel

### Collaboration en direct
- Voir les autres utilisateurs actifs
- Messages instantanés dans les collections
- Partage d'articles en temps réel

## Trucs et astuces

### Organisation efficace
- Utilisez les favoris pour sauvegarder les articles importants
- Créez des collections thématiques pour organiser le contenu
- Utilisez la recherche pour retrouver rapidement un article

### Collaboration
- Invitez vos collègues dans des collections privées
- Utilisez le chat pour discuter des articles en temps réel
- Partagez des collections publiques pour la veille collaborative

### Performance
- L'application fonctionne sur tous les appareils (ordinateur, tablette, mobile)
- Interface responsive qui s'adapte à votre écran
- Synchronisation entre tous vos appareils

## Résolution de problèmes

### Problèmes de connexion
- Vérifiez votre connexion internet
- Essayez de rafraîchir la page
- Contactez l'administrateur si le problème persiste

### Erreur "Service Unavailable" avec Google OAuth
Si vous voyez cette erreur lors de la connexion Google :

**Cause** : Configuration OAuth incorrecte ou URL de redirection manquante

**Solution** :
1. L'administrateur doit configurer les bonnes clés OAuth pour votre environnement
2. Vérifier que l'URL de redirection est autorisée dans Google Console
3. En attendant, utilisez la connexion par email/mot de passe

**Pour les administrateurs** :
- Aller sur https://console.developers.google.com
- Ajouter l'URL de callback dans "URI de redirection autorisées"
- Vérifier que les clés CLIENT_ID et CLIENT_SECRET sont correctes

### Flux RSS non accessible
- Vérifiez que l'URL du flux est correcte
- Certains sites bloquent l'accès automatique aux flux
- Le flux peut être temporairement indisponible

### Articles non mis à jour
- Les flux se mettent à jour automatiquement toutes les 30 minutes
- Vous pouvez forcer la mise à jour depuis l'interface
- Certains flux publient rarement du nouveau contenu

## Support technique

En cas de problème technique :
1. Vérifiez les messages d'erreur affichés
2. Consultez les logs dans la console du navigateur (F12)
3. Contactez l'équipe de support avec une description détaillée
4. Incluez des captures d'écran si possible

## Bonnes pratiques

### Sécurité
- Utilisez un mot de passe fort pour votre compte
- Déconnectez-vous sur les ordinateurs partagés
- Ne partagez jamais vos identifiants

### Utilisation collaborative
- Respectez les autres membres dans les discussions
- Partagez du contenu pertinent et de qualité
- Utilisez les permissions appropriées pour vos collections

### Performance
- Fermez les onglets inutilisés
- Videz régulièrement le cache de votre navigateur
- Utilisez une connexion internet stable pour les fonctionnalités temps réel