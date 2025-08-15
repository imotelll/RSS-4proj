# 🐧 Guide de Déploiement Manuel sur Debian - SUPRSS

Ce guide vous explique comment déployer SUPRSS directement sur votre serveur Debian sans Docker.

## 📋 Prérequis

### 1. Installer Node.js et npm
```bash
# Installer Node.js 18+ via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier les versions
node --version  # doit être >= 18
npm --version
```

### 2. Installer PostgreSQL
```bash
# Installer PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Démarrer et activer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Installer PM2 (gestionnaire de processus)
```bash
sudo npm install -g pm2
```

### 4. Installer Nginx (optionnel - reverse proxy)
```bash
sudo apt install nginx -y
```

## 🔧 Configuration de la base de données

### 1. Créer l'utilisateur et la base de données
```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans le prompt PostgreSQL :
CREATE USER suprss_user WITH PASSWORD 'VotreMotDePasseSecurise123!';
CREATE DATABASE suprss_production OWNER suprss_user;
GRANT ALL PRIVILEGES ON DATABASE suprss_production TO suprss_user;
\q
```

### 2. Configurer PostgreSQL pour les connexions locales
```bash
# Éditer le fichier de configuration
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Ajouter cette ligne (adapter la version) :
local   suprss_production    suprss_user                     md5

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

## 🚀 Déploiement de l'application

### 1. Préparer l'environnement
```bash
# Créer un utilisateur dédié (recommandé)
sudo adduser --system --group --shell /bin/bash suprss
sudo mkdir -p /opt/suprss
sudo chown suprss:suprss /opt/suprss

# Se connecter en tant que suprss
sudo -u suprss -s
cd /opt/suprss
```

### 2. Cloner et configurer le projet
```bash
# Cloner le projet
git clone https://github.com/votre-repo/suprss.git .

# Installer les dépendances
npm install

# Copier et configurer l'environnement
cp .env.example .env
nano .env
```

### 3. Configurer le fichier .env
```bash
# Configuration base de données
DATABASE_URL=postgresql://suprss_user:VotreMotDePasseSecurise123!@localhost:5432/suprss_production
PGHOST=localhost
PGPORT=5432
PGUSER=suprss_user
PGPASSWORD=VotreMotDePasseSecurise123!
PGDATABASE=suprss_production

# Configuration serveur
NODE_ENV=production
PORT=5000
SESSION_SECRET=votre-secret-ultra-securise-32-caracteres-minimum

# Domaine (remplacer par votre IP/domaine)
REPLIT_DOMAINS=votre-ip-debian,localhost,127.0.0.1

# Authentification Replit (si utilisée)
ISSUER_URL=https://replit.com/oidc
REPL_ID=production-debian-deployment

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID=votre-client-id-google
GOOGLE_CLIENT_SECRET=votre-client-secret-google
```

### 4. Préparer la base de données
```bash
# Exécuter les migrations
npm run db:push
# ou si la commande n'existe pas :
npx drizzle-kit push
```

### 5. Build du frontend
```bash
# Builder le frontend React
cd client
npm run build
cd ..
```

## 🚀 Lancement avec PM2

### 1. Créer le fichier de configuration PM2
```bash
# Créer ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'suprss-server',
    script: 'npm',
    args: 'run start:prod',
    cwd: '/opt/suprss',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/suprss/error.log',
    out_file: '/var/log/suprss/out.log',
    log_file: '/var/log/suprss/combined.log',
    time: true
  }]
}
EOF
```

### 2. Créer le dossier de logs
```bash
sudo mkdir -p /var/log/suprss
sudo chown suprss:suprss /var/log/suprss
```

### 3. Ajouter le script de démarrage dans package.json
```bash
# Vérifier que package.json contient :
npm run start:prod || echo "Ajout du script nécessaire"
```

Si le script n'existe pas, ajoutez-le dans package.json :
```json
{
  "scripts": {
    "start:prod": "NODE_ENV=production tsx server/index.ts"
  }
}
```

### 4. Lancer l'application
```bash
# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
# Suivre les instructions affichées (exécuter la commande sudo suggérée)
```

## 🔧 Configuration Nginx (Reverse Proxy)

### 1. Créer la configuration Nginx
```bash
sudo nano /etc/nginx/sites-available/suprss
```

Contenu du fichier :
```nginx
server {
    listen 80;
    server_name votre-ip-debian;  # ou votre-domaine.com
    
    # Frontend statique
    location / {
        root /opt/suprss/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Headers de sécurité
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket pour temps réel
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Activer le site
```bash
# Lien symbolique pour activer
sudo ln -s /etc/nginx/sites-available/suprss /etc/nginx/sites-enabled/

# Désactiver le site par défaut
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 Configuration HTTPS avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir le certificat SSL (remplacer par votre domaine)
sudo certbot --nginx -d votre-domaine.com

# Le certificat se renouvellera automatiquement
```

## 🔧 Scripts de maintenance

### 1. Script de mise à jour
```bash
# Créer update-suprss.sh
cat > /opt/suprss/update-suprss.sh << 'EOF'
#!/bin/bash
cd /opt/suprss
git pull origin main
npm install
cd client && npm run build && cd ..
pm2 reload ecosystem.config.js
echo "Mise à jour terminée"
EOF

chmod +x /opt/suprss/update-suprss.sh
```

### 2. Script de sauvegarde
```bash
# Créer backup-suprss.sh
cat > /opt/suprss/backup-suprss.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/suprss/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Sauvegarde base de données
pg_dump -h localhost -U suprss_user suprss_production > $BACKUP_DIR/suprss_db_$DATE.sql

# Garder seulement les 7 dernières sauvegardes
find $BACKUP_DIR -name "suprss_db_*.sql" -mtime +7 -delete

echo "Sauvegarde créée : $BACKUP_DIR/suprss_db_$DATE.sql"
EOF

chmod +x /opt/suprss/backup-suprss.sh
```

### 3. Crontab pour sauvegardes automatiques
```bash
# Ajouter au crontab de l'utilisateur suprss
sudo -u suprss crontab -e

# Ajouter cette ligne pour sauvegarder tous les jours à 2h00
0 2 * * * /opt/suprss/backup-suprss.sh >/dev/null 2>&1
```

## 🔧 Commandes de gestion

### Gestion PM2
```bash
# Voir l'état
pm2 status

# Voir les logs
pm2 logs suprss-server

# Redémarrer
pm2 restart suprss-server

# Arrêter
pm2 stop suprss-server

# Monitoring temps réel
pm2 monit
```

### Gestion des services
```bash
# Nginx
sudo systemctl status nginx
sudo systemctl reload nginx

# PostgreSQL
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

## 🔍 Vérification du déploiement

```bash
# Vérifier que tout fonctionne
curl -I http://localhost/api/health
curl -I http://votre-ip-debian

# Vérifier les processus
pm2 status
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :5000

# Vérifier les logs
tail -f /var/log/suprss/combined.log
sudo tail -f /var/log/nginx/access.log
```

## 🛠️ Dépannage

### Problèmes courants

1. **Erreur de connexion base de données** :
```bash
# Tester la connexion
psql -h localhost -U suprss_user -d suprss_production
```

2. **Port 5000 déjà utilisé** :
```bash
# Voir qui utilise le port
sudo netstat -tlnp | grep :5000
# Changer le port dans .env si nécessaire
```

3. **Permissions de fichiers** :
```bash
sudo chown -R suprss:suprss /opt/suprss
chmod +x /opt/suprss/*.sh
```

4. **Problème de build frontend** :
```bash
cd /opt/suprss/client
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🔄 Monitoring et maintenance

### Logs à surveiller
```bash
# Application
tail -f /var/log/suprss/combined.log

# Nginx
sudo tail -f /var/log/nginx/error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Nettoyage périodique
```bash
# Nettoyer les logs PM2 anciens
pm2 flush

# Nettoyer les logs système
sudo journalctl --vacuum-time=7d
```

Votre application SUPRSS est maintenant déployée nativement sur Debian ! Elle sera accessible via http://votre-ip-debian avec toutes les fonctionnalités opérationnelles.