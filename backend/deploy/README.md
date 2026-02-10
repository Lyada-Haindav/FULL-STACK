# AWS EC2 Spring Boot Deployment Guide

## Prerequisites
- AWS account with EC2 access
- Domain name (optional, but recommended)

## Step 1: Launch EC2 Instance

1. **Go to AWS Console → EC2 → Launch Instance**
2. **Choose AMI**: Ubuntu Server 22.04 LTS
3. **Instance Type**: t2.micro (Free Tier) or t3.small for production
4. **Key Pair**: Create or use existing key pair
5. **Security Group**: Allow SSH (22), HTTP (80), HTTPS (443), Custom (8080)
6. **Storage**: 20GB minimum
7. Launch instance

## Step 2: Connect to EC2

```bash
# SSH into your instance
ssh -i your-key-pair.pem ubuntu@your-ec2-public-ip
```

## Step 3: Setup Server Environment

```bash
# Download and run setup script
wget https://raw.githubusercontent.com/your-repo/main/backend/deploy/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

## Step 4: Deploy Your Application

### Option A: Using Git (Recommended)
```bash
# Install Git
sudo apt install -y git

# Clone your repository
cd /opt/form-weaver
git clone https://github.com/your-username/Form-Weaver-AI.git .

# Run deployment script
chmod +x backend/deploy/deploy.sh
./backend/deploy/deploy.sh
```

### Option B: Manual Upload
```bash
# Upload your backend code using SCP
scp -i your-key-pair.pem -r backend/ ubuntu@your-ec2-public-ip:/opt/form-weaver/

# SSH and deploy
ssh -i your-key-pair.pem ubuntu@your-ec2-public-ip
cd /opt/form-weaver
chmod +x backend/deploy/deploy.sh
./backend/deploy/deploy.sh
```

## Step 5: Configure Environment Variables

Create production environment file:
```bash
sudo nano /opt/form-weaver/.env
```

Add your production variables:
```env
# Database
DATABASE_URL=jdbc:mysql://localhost:3306/form_weaver
DATABASE_USERNAME=formweaver
DATABASE_PASSWORD=secure_password_123

# AI Integrations (replace with actual keys)
AI_INTEGRATIONS_OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-google-key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com
```

## Step 6: Configure Domain (Optional)

### Using Route 53
1. Go to Route 53 → Hosted zones
2. Create A record pointing to your EC2 public IP
3. Update Nginx configuration with your domain

### Update Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/form-weaver-backend
```
Replace `your-domain.com` with your actual domain.

## Step 7: SSL Certificate (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 8: Monitor and Maintain

### Check Application Status
```bash
# Service status
sudo systemctl status form-weaver-backend

# View logs
sudo journalctl -u form-weaver-backend -f

# Nginx status
sudo systemctl status nginx
```

### Update Application
```bash
cd /opt/form-weaver
git pull
./backend/deploy/deploy.sh
```

## Security Considerations

1. **Change default passwords**: Update MySQL password in scripts
2. **Firewall**: Keep only necessary ports open
3. **Updates**: Regularly update system packages
4. **Backups**: Set up database backups
5. **Monitoring**: Consider CloudWatch monitoring

## Troubleshooting

### Application won't start
```bash
# Check logs
sudo journalctl -u form-weaver-backend -n 50

# Check Java version
java -version

# Check port availability
sudo netstat -tlnp | grep 8080
```

### Database connection issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u formweaver -p form_weaver
```

### Nginx issues
```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

## Cost Optimization

- Use t2.micro for development/testing
- Enable auto-scaling for production
- Use Reserved Instances for long-term deployment
- Monitor CloudWatch metrics to optimize instance size

## Next Steps

After backend deployment:
1. Deploy frontend to Vercel/Netlify
2. Update frontend API endpoint to your EC2 domain
3. Configure CORS in Spring Boot
4. Set up CI/CD pipeline for automated deployments
