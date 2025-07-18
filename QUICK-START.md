# 🚀 Déploiement Rapide avec Docker Compose

## 📋 Étapes Rapides

### 1. Préparer l'environnement
```bash
# Copier la configuration Docker
cp .env.docker .env

# Éditer si nécessaire (changez les mots de passe)
nano .env
```

### 2. Lancer l'application
```bash
# Construire et démarrer
docker-compose up -d --build

# Vérifier le statut
docker-compose ps
```

### 3. Tester que tout fonctionne
```bash
# Lancer le script de test automatique
chmod +x docker-test.sh
./docker-test.sh
```

### 4. Accéder à l'application
- **Frontend** : http://localhost:4173 (ou votre domaine:4173)
- **API** : http://localhost:5000 (ou votre domaine:5000)

## 🔧 Configuration pour 4proj.lpasr.fr

Modifiez dans le fichier `.env` :
```bash
REPLIT_DOMAINS=4proj.lpasr.fr,www.4proj.lpasr.fr
```

## 🔒 HTTPS avec Nginx (Production)

Créez `/etc/nginx/sites-available/suprss` :
```nginx
server {
    listen 80;
    server_name 4proj.lpasr.fr;
    
    location / {
        proxy_pass http://localhost:4173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Puis :
```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/suprss /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Ajouter SSL avec Let's Encrypt
sudo certbot --nginx -d 4proj.lpasr.fr
```

## 🔧 Commandes Utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Redémarrer un service
docker-compose restart server

# Arrêter tout
docker-compose down

# Supprimer et recommencer
docker-compose down -v
docker-compose up -d --build
```

C'est tout ! Votre application SUPRSS est maintenant accessible ! 🎉