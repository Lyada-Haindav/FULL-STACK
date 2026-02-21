# EC2 Backend Service Deployment (Systemd)

This guide deploys the backend as a Linux service (`systemd`) similar to a hackathon-style service deployment.

## 1. Launch EC2

Use Ubuntu 22.04 and allow inbound ports `22`, `80`, `443`, `8080`.

## 2. SSH

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

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
APP_DOMAIN=your-api-domain.com ./backend/deploy/deploy.sh
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
```

## 7. Operate service

```bash
sudo systemctl status form-weaver-backend
sudo systemctl restart form-weaver-backend
sudo journalctl -u form-weaver-backend -f
```

## 8. Nginx

Nginx config is generated at:

`/etc/nginx/sites-available/form-weaver-backend`

It proxies to `127.0.0.1:8080`.

## 9. SSL (optional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-api-domain.com
```
