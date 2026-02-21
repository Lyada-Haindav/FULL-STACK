#!/bin/bash

# Prepare Ubuntu EC2 host for Form Weaver full-stack service deployment.

set -euo pipefail

echo "Starting EC2 setup for full-stack service..."

echo "Updating packages..."
sudo apt update
sudo apt upgrade -y

echo "Installing runtime dependencies..."
sudo apt install -y openjdk-17-jdk maven nginx git ufw curl rsync

echo "Creating application directory..."
sudo mkdir -p /opt/form-weaver
sudo chown "$USER:$USER" /opt/form-weaver

echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "Enabling Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

echo "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "EC2 setup completed."
echo "Next steps:"
echo "1. Clone your repo to /opt/form-weaver"
echo "2. Run backend/deploy/deploy.sh"
echo "3. Fill /opt/form-weaver/.env when prompted"
