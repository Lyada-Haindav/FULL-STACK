#!/usr/bin/env bash

# One-command deploy from local machine -> EC2.
# - Installs server dependencies
# - Clones/updates repo
# - Builds frontend locally (faster on t3.micro)
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
    [--frontend-build local|remote] \
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
FRONTEND_BUILD_MODE="local"
REPO_URL="https://github.com/Lyada-Haindav/FULL-STACK.git"
APP_DIR="/opt/form-weaver"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

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
    --frontend-build)
      FRONTEND_BUILD_MODE="${2:-}"
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

if [[ "$FRONTEND_BUILD_MODE" != "local" && "$FRONTEND_BUILD_MODE" != "remote" ]]; then
  echo "Error: --frontend-build must be 'local' or 'remote'."
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
RSYNC_RSH="ssh -i \"$KEY_PATH\" -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ServerAliveCountMax=120"

echo "1/6 Preparing EC2 host..."
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

if [[ "$FRONTEND_BUILD_MODE" = "local" ]]; then
  echo "2/6 Building frontend locally..."
  if ! command -v npm >/dev/null 2>&1; then
    echo "Error: npm not found on local machine."
    exit 1
  fi

  cd "$LOCAL_REPO_DIR"
  npm ci --no-audit --no-fund
  npm run build

  if [[ ! -d "$LOCAL_REPO_DIR/dist/public" ]]; then
    echo "Error: local frontend build output not found at $LOCAL_REPO_DIR/dist/public"
    exit 1
  fi

  echo "3/6 Uploading frontend bundle..."
  rsync -az --delete -e "$RSYNC_RSH" \
    "$LOCAL_REPO_DIR/dist/public/" \
    "$SSH_USER@$HOST:/tmp/form-weaver-public/"
  REMOTE_SKIP_FRONTEND_BUILD=1
else
  echo "2/6 Skipping local frontend build (remote build mode)."
  REMOTE_SKIP_FRONTEND_BUILD=0
fi

echo "4/6 Uploading environment file..."
scp "${SSH_OPTS[@]}" "$ENV_PATH" "$SSH_USER@$HOST:/tmp/formweaver-backend.env"

echo "5/6 Installing assets and env file..."
ssh "${SSH_OPTS[@]}" "$SSH_USER@$HOST" "APP_DIR='$APP_DIR' SSH_USER='$SSH_USER' FRONTEND_BUILD_MODE='$FRONTEND_BUILD_MODE' bash -s" <<'REMOTE'
set -euo pipefail

if [ "$FRONTEND_BUILD_MODE" = "local" ]; then
  mkdir -p "$APP_DIR/dist/public"
  rsync -a --delete /tmp/form-weaver-public/ "$APP_DIR/dist/public/"
  rm -rf /tmp/form-weaver-public
fi

sudo mv /tmp/formweaver-backend.env "$APP_DIR/.env"
sudo chown "$SSH_USER:$SSH_USER" "$APP_DIR/.env"
sudo chmod 600 "$APP_DIR/.env"
REMOTE

echo "6/6 Deploying app..."
ssh "${SSH_OPTS[@]}" "$SSH_USER@$HOST" "APP_DIR='$APP_DIR' SSH_USER='$SSH_USER' APP_DOMAIN='$APP_DOMAIN' REMOTE_SKIP_FRONTEND_BUILD='$REMOTE_SKIP_FRONTEND_BUILD' bash -s" <<'REMOTE'
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
SKIP_FRONTEND_BUILD="$REMOTE_SKIP_FRONTEND_BUILD" \
./backend/deploy/deploy.sh

sudo systemctl status form-weaver-backend --no-pager || true
REMOTE

echo "Done."
echo "Frontend/API: http://$HOST"
echo "Backend health: http://$HOST/api/health"
echo "Logs: ssh -i \"$KEY_PATH\" $SSH_USER@$HOST 'sudo journalctl -u form-weaver-backend -f'"
