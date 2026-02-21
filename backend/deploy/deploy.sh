#!/bin/bash

# Deploy backend as a systemd service on EC2.
# Expected repo layout on server:
#   /opt/form-weaver/backend/pom.xml

set -euo pipefail

APP_NAME="form-weaver-backend"
APP_DIR="/opt/form-weaver"
BACKEND_DIR="$APP_DIR/backend"
JAR_FILE="$APP_DIR/$APP_NAME.jar"
ENV_FILE="$APP_DIR/.env"
SERVICE_FILE="/etc/systemd/system/$APP_NAME.service"
NGINX_FILE="/etc/nginx/sites-available/$APP_NAME"
DOMAIN="${APP_DOMAIN:-_}"

echo "Deploying $APP_NAME ..."

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Backend directory not found: $BACKEND_DIR"
  echo "Clone repo into /opt/form-weaver first."
  exit 1
fi

cd "$BACKEND_DIR"

echo "Building backend jar..."
mvn clean package -DskipTests

if [ ! -f "$BACKEND_DIR/target/form-weaver-backend-0.0.1-SNAPSHOT.jar" ]; then
  echo "Build output jar not found in target/"
  exit 1
fi

echo "Copying jar to $JAR_FILE"
cp "$BACKEND_DIR/target/form-weaver-backend-0.0.1-SNAPSHOT.jar" "$JAR_FILE"

if [ ! -f "$ENV_FILE" ]; then
  echo "Creating environment template at $ENV_FILE"
  cat > "$ENV_FILE" <<'EOF'
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
MONGODB_DATABASE=form_weaver
GOOGLE_API_KEY=replace_me
JWT_SECRET=replace_with_long_secret
DEMO_USER_EMAIL=demo@formweaver.local
DEMO_USER_PASSWORD=demo1234
EOF
  chmod 600 "$ENV_FILE"
  echo "Update $ENV_FILE with real values and run deploy.sh again."
  exit 1
fi

echo "Writing systemd service..."
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Form Weaver Backend Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=$APP_DIR
EnvironmentFile=-$ENV_FILE
Environment=SPRING_PROFILES_ACTIVE=prod
ExecStart=/usr/bin/java -jar $JAR_FILE
SuccessExitStatus=143
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

echo "Writing Nginx reverse proxy config..."
sudo tee "$NGINX_FILE" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 30m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf "$NGINX_FILE" "/etc/nginx/sites-enabled/$APP_NAME"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable "$APP_NAME"
sudo systemctl restart "$APP_NAME"

echo "Service status:"
sudo systemctl status "$APP_NAME" --no-pager || true

echo "Deployment finished."
echo "Logs: sudo journalctl -u $APP_NAME -f"
