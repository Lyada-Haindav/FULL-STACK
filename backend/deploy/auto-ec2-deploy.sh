#!/usr/bin/env bash

# One-command deploy from local machine -> EC2.
# - Installs server dependencies
# - Clones/updates repo
# - Uploads .env file
# - Builds and deploys frontend + backend

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./backend/deploy/auto-ec2-deploy.sh \
    --host <ec2-ip-or-domain> \
    --key <path-to-key.pem> \
    --env <path-to-env-file> \
    [--user ec2-user] \
    [--domain _] \
    [--repo https://github.com/Lyada-Haindav/FULL-STACK.git]

Example:
  ./backend/deploy/auto-ec2-deploy.sh \
    --host 13.201.96.51 \
    --key ~/Downloads/formweaver-key.pem \
    --env ~/Downloads/formweaver-backend.env \
    --user ec2-user \
    --domain _
EOF
}

HOST=""
SSH_USER="ec2-user"
KEY_PATH=""
ENV_PATH=""
APP_DOMAIN="_"
REPO_URL="https://github.com/Lyada-Haindav/FULL-STACK.git"
APP_DIR="/opt/form-weaver"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    --user)
      SSH_USER="${2:-}"
      shift 2
      ;;
    --key)
      KEY_PATH="${2:-}"
      shift 2
      ;;
    --env)
      ENV_PATH="${2:-}"
      shift 2
      ;;
    --domain)
      APP_DOMAIN="${2:-}"
      shift 2
      ;;
    --repo)
      REPO_URL="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

KEY_PATH="${KEY_PATH/#\~/$HOME}"
ENV_PATH="${ENV_PATH/#\~/$HOME}"

if [[ -z "$HOST" || -z "$KEY_PATH" || -z "$ENV_PATH" ]]; then
  echo "Error: --host, --key, and --env are required."
  usage
  exit 1
fi

if [[ ! -f "$KEY_PATH" ]]; then
  echo "Error: key file not found: $KEY_PATH"
  exit 1
fi

if [[ ! -f "$ENV_PATH" ]]; then
  echo "Error: env file not found: $ENV_PATH"
  exit 1
fi

echo "Setting key permissions..."
chmod 400 "$KEY_PATH"

SSH_OPTS=(
  -i "$KEY_PATH"
  -o StrictHostKeyChecking=accept-new
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=120
)

echo "1/4 Preparing EC2 host..."
ssh "${SSH_OPTS[@]}" "$SSH_USER@$HOST" "REPO_URL='$REPO_URL' APP_DIR='$APP_DIR' SSH_USER='$SSH_USER' bash -s" <<'REMOTE'
set -euo pipefail

sudo mkdir -p "$APP_DIR"
sudo chown "$SSH_USER:$SSH_USER" "$APP_DIR"

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull --ff-only
else
  git clone "$REPO_URL" "$APP_DIR"
fi

cd /tmp
curl -fsSL -o ec2-setup.sh https://raw.githubusercontent.com/Lyada-Haindav/FULL-STACK/main/backend/deploy/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
REMOTE

echo "2/4 Uploading environment file..."
scp "${SSH_OPTS[@]}" "$ENV_PATH" "$SSH_USER@$HOST:/tmp/formweaver-backend.env"

echo "3/4 Installing env file..."
ssh "${SSH_OPTS[@]}" "$SSH_USER@$HOST" "APP_DIR='$APP_DIR' SSH_USER='$SSH_USER' bash -s" <<'REMOTE'
set -euo pipefail
sudo mv /tmp/formweaver-backend.env "$APP_DIR/.env"
sudo chown "$SSH_USER:$SSH_USER" "$APP_DIR/.env"
sudo chmod 600 "$APP_DIR/.env"
REMOTE

echo "4/4 Deploying app..."
ssh "${SSH_OPTS[@]}" "$SSH_USER@$HOST" "APP_DIR='$APP_DIR' SSH_USER='$SSH_USER' APP_DOMAIN='$APP_DOMAIN' bash -s" <<'REMOTE'
set -euo pipefail
cd "$APP_DIR"
chmod +x backend/deploy/deploy.sh

APP_RUN_GROUP="$SSH_USER"
if ! id -gn "$SSH_USER" >/dev/null 2>&1; then
  APP_RUN_GROUP="$(id -gn)"
fi

APP_DOMAIN="$APP_DOMAIN" \
APP_RUN_USER="$SSH_USER" \
APP_RUN_GROUP="$APP_RUN_GROUP" \
./backend/deploy/deploy.sh

sudo systemctl status form-weaver-backend --no-pager || true
REMOTE

echo "Done."
echo "Frontend/API: http://$HOST"
echo "Backend health: http://$HOST/api/health"
echo "Logs: ssh -i \"$KEY_PATH\" $SSH_USER@$HOST 'sudo journalctl -u form-weaver-backend -f'"
