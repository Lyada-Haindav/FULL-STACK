#!/bin/bash

# AWS EC2 Spring Boot Deployment Script
# Run this script on your EC2 instance after SSH

set -e

echo "🚀 Starting Spring Boot Backend Deployment on EC2"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Java 17
echo "☕ Installing Java 17..."
sudo apt install -y openjdk-17-jdk

# Install Maven
echo "🔨 Installing Maven..."
sudo apt install -y maven

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# Install MySQL
echo "🗄️ Installing MySQL..."
sudo apt install -y mysql-server

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/form-weaver
sudo chown $USER:$USER /opt/form-weaver

# Setup MySQL database
echo "🔧 Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS form_weaver;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'formweaver'@'localhost' IDENTIFIED BY 'secure_password_123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON form_weaver.* TO 'formweaver'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Configure MySQL
echo "🔧 Configuring MySQL..."
sudo sed -i 's/bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
sudo systemctl restart mysql

# Setup firewall
echo "🔥 Setting up firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8080
sudo ufw --force enable

echo "✅ EC2 setup completed!"
echo "📝 Next steps:"
echo "1. Copy your backend code to /opt/form-weaver"
echo "2. Run the deployment script: deploy.sh"
echo "3. Configure your environment variables"
