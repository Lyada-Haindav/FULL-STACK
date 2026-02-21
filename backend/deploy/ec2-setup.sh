#!/bin/bash

# Prepare Ubuntu EC2 host for Form Weaver backend service deployment.

set -euo pipefail

echo "Starting EC2 setup for backend service..."

echo "Updating packages..."
sudo apt update
sudo apt upgrade -y

echo "Installing runtime dependencies..."
sudo apt install -y openjdk-17-jdk maven nginx git ufw

echo "Creating application directory..."
sudo mkdir -p /opt/form-weaver
sudo chown "$USER:$USER" /opt/form-weaver

echo "Enabling Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

echo "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8080
sudo ufw --force enable

echo "EC2 setup completed."
echo "Next steps:"
echo "1. Clone your repo to /opt/form-weaver"
echo "2. Run backend/deploy/deploy.sh"
echo "3. Fill /opt/form-weaver/.env when prompted"
