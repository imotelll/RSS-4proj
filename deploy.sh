#!/bin/bash

# Script de déploiement pour SUPRSS
# Exécutez ce script sur votre serveur

echo "🚀 Début du déploiement SUPRSS..."

# Configuration (à modifier selon votre serveur)
APP_DIR="/var/www/suprss"
SERVICE_NAME="suprss"
NODE_VERSION="20"

# Arrêter l'application si elle tourne
echo "⏹️  Arrêt de l'application..."
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

# Créer le répertoire d'application
sudo mkdir -p $APP_DIR
cd $APP_DIR

# Télécharger ou synchroniser le code
echo "📥 Synchronisation du code..."
# Remplacez cette ligne par votre méthode de récupération du code
# git pull origin main  # Si vous utilisez Git
# ou copiez les fichiers manuellement

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install --production

# Construire l'application
echo "🔨 Construction de l'application..."
npm run build

# Configuration de la base de données
echo "🗄️  Configuration de la base de données..."
npm run db:push

# Configuration du service systemd
echo "⚙️  Configuration du service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=SUPRSS RSS Reader
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=5000
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/node $APP_DIR/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Démarrer le service
echo "🎯 Démarrage du service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# Configuration Nginx (optionnel)
echo "🌐 Configuration Nginx..."
sudo tee /etc/nginx/sites-available/$SERVICE_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/$SERVICE_NAME /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Déploiement terminé !"
echo "🌐 L'application devrait être accessible sur http://votre-domaine.com"
echo "📊 Vérifiez le statut : sudo systemctl status $SERVICE_NAME"
echo "📝 Logs : sudo journalctl -u $SERVICE_NAME -f"