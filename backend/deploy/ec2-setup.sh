#!/bin/bash

# Prepare Linux EC2 host for Form Weaver full-stack service deployment.

set -euo pipefail

echo "Starting EC2 setup for full-stack service..."

install_node_20_deb() {
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
}

install_node_20_rpm() {
  echo "Installing Node.js 20..."
  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo -E bash -
  if command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y nodejs
  else
    sudo yum install -y nodejs
  fi
}

echo "Creating application directory..."
sudo mkdir -p /opt/form-weaver
sudo chown "$USER:$USER" /opt/form-weaver

if command -v apt >/dev/null 2>&1; then
  echo "Detected Debian/Ubuntu."
  echo "Updating packages..."
  sudo apt update
  sudo apt upgrade -y

  echo "Installing runtime dependencies..."
  sudo apt install -y openjdk-17-jdk maven nginx git ufw curl rsync
  install_node_20_deb

  echo "Enabling Nginx..."
  sudo systemctl enable nginx
  sudo systemctl start nginx

  echo "Configuring firewall (ufw)..."
  sudo ufw allow 22
  sudo ufw allow 80
  sudo ufw allow 443
  sudo ufw --force enable
elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
  echo "Detected RHEL/Amazon Linux."
  if command -v dnf >/dev/null 2>&1; then
    PM=dnf
  else
    PM=yum
  fi

  echo "Updating packages..."
  sudo "$PM" update -y

  echo "Installing runtime dependencies..."
  sudo "$PM" install -y java-17-amazon-corretto-devel maven nginx git rsync || \
    sudo "$PM" install -y java-21-amazon-corretto-devel maven nginx git rsync
  # Amazon Linux ships curl-minimal by default; installing curl can conflict.
  if ! command -v curl >/dev/null 2>&1; then
    sudo "$PM" install -y curl-minimal || true
  fi
  install_node_20_rpm

  echo "Enabling Nginx..."
  sudo systemctl enable nginx
  sudo systemctl start nginx

  if command -v firewall-cmd >/dev/null 2>&1 && sudo systemctl is-active --quiet firewalld; then
    echo "Configuring firewall (firewalld)..."
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
  else
    echo "Skipping host firewall setup (security group should allow 22/80/443)."
  fi
else
  echo "Unsupported Linux distribution. Install Java 17, Maven, Node 20, Nginx, git, curl, rsync manually."
  exit 1
fi

echo "EC2 setup completed."
echo "Next steps:"
echo "1. Clone your repo to /opt/form-weaver"
echo "2. Run backend/deploy/deploy.sh"
echo "3. Fill /opt/form-weaver/.env when prompted"
