# EC2 Full-Stack Deployment (Systemd + Nginx)

This deploys frontend + backend on one EC2 instance:
- Backend runs as a `systemd` service.
- Nginx serves frontend static files.
- Nginx proxies `/api/*` to backend on `127.0.0.1:8080`.
- Supports Ubuntu and Amazon Linux.

## 1. Launch EC2

Use Linux (Amazon Linux 2023 or Ubuntu 22.04) and allow inbound ports `22`, `80`, `443`.

## 2. SSH

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

For Ubuntu, user is `ubuntu`.

## 3. Prepare server

```bash
cd /tmp
curl -L -o ec2-setup.sh https://raw.githubusercontent.com/Lyada-Haindav/FULL-STACK/main/backend/deploy/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

## 4. Clone project

```bash
cd /opt/form-weaver
git clone https://github.com/Lyada-Haindav/FULL-STACK.git .
```

## 5. Deploy service

```bash
chmod +x backend/deploy/deploy.sh
APP_DOMAIN=your-domain.com ./backend/deploy/deploy.sh
```

If `/opt/form-weaver/.env` does not exist, the script creates a template and exits once.
Fill it and run deploy again.

## 6. Required env file

File: `/opt/form-weaver/.env`

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
MONGODB_DATABASE=form_weaver
GOOGLE_API_KEY=your_google_key
JWT_SECRET=replace_with_long_secret
DEMO_USER_EMAIL=demo@formweaver.local
DEMO_USER_PASSWORD=demo1234
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=your_brevo_smtp_username
SMTP_PASSWORD=your_brevo_smtp_password
SMTP_FROM=your_verified_sender_email
BREVO_API_KEY=your_brevo_api_key
APP_BASE_URL=https://your-domain.com
APP_FRONTEND_URL=https://your-domain.com
```

## 7. Operate service

```bash
sudo systemctl status form-weaver-backend
sudo systemctl restart form-weaver-backend
sudo journalctl -u form-weaver-backend -f
```

You can override runtime user if needed:

```bash
APP_RUN_USER=ec2-user APP_RUN_GROUP=ec2-user APP_DOMAIN=your-domain.com ./backend/deploy/deploy.sh
```

## 8. Nginx

Nginx config is generated at:

`/etc/nginx/sites-available/form-weaver-backend`

- `/api/*` -> backend `127.0.0.1:8080`
- `/` -> frontend static files at `/var/www/form-weaver`

## 9. SSL (optional)

```bash
sudo dnf install -y certbot python3-certbot-nginx || sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 10. One-command automatic deploy (from your laptop)

You can deploy everything automatically (setup + env upload + build + run) with:

```bash
chmod +x backend/deploy/auto-ec2-deploy.sh
./backend/deploy/auto-ec2-deploy.sh \
  --host 13.201.96.51 \
  --key ~/Downloads/formweaver-key.pem \
  --env ~/Downloads/formweaver-backend.env \
  --user ec2-user \
  --domain _
```

This command runs from your local machine and completes the full EC2 deployment.
By default, it builds frontend locally (faster and more stable on t3.micro) and only builds backend on EC2.
If `--domain _` is passed, the script automatically uses `--host` as Nginx server name.

If you want frontend build on EC2 instead:

```bash
./backend/deploy/auto-ec2-deploy.sh \
  --host 13.201.96.51 \
  --key ~/Downloads/formweaver-key.pem \
  --env ~/Downloads/formweaver-backend.env \
  --frontend-build remote
```
