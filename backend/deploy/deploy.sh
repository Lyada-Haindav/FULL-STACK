#!/bin/bash

# Spring Boot Application Deployment Script
# Run this after ec2-setup.sh and copying your code

set -e

APP_NAME="form-weaver-backend"
APP_DIR="/opt/form-weaver"
JAR_FILE="$APP_DIR/$APP_NAME.jar"
SERVICE_FILE="/etc/systemd/system/$APP_NAME.service"

echo "🚀 Deploying Spring Boot Application"

# Navigate to application directory
cd $APP_DIR

# Build the application
echo "🔨 Building Spring Boot application..."
mvn clean package -DskipTests

# Copy JAR file
echo "📦 Copying JAR file..."
cp target/*.jar $JAR_FILE

# Create systemd service
echo "⚙️ Creating systemd service..."
sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Form Weaver Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/java -jar $JAR_FILE
Restart=always
RestartSec=10
Environment=SPRING_PROFILES_ACTIVE=prod
Environment=DATABASE_URL=jdbc:mysql://localhost:3306/form_weaver
Environment=DATABASE_USERNAME=formweaver
Environment=DATABASE_PASSWORD=secure_password_123

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx reverse proxy
echo "🌐 Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or EC2 IP

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Reload systemd and start service
echo "🔄 Starting application service..."
sudo systemctl daemon-reload
sudo systemctl enable $APP_NAME
sudo systemctl restart $APP_NAME

# Check service status
echo "📊 Checking service status..."
sudo systemctl status $APP_NAME --no-pager

echo "✅ Deployment completed!"
echo "🌐 Your application should be available at: http://your-domain.com"
echo "📋 Check logs with: sudo journalctl -u $APP_NAME -f"
