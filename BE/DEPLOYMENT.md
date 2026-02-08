# Hướng dẫn Deploy API

## 📋 Chuẩn bị

### 1. Cấu hình Database Production
- Tạo database MySQL trên server
- Chạy các câu lệnh CREATE TABLE
- Lưu thông tin kết nối

### 2. Cấu hình Environment Variables

Tạo file `.env` trên server production:

```env
# Database
DB_HOST=your-production-host.com
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=project_mma

# Server
PORT=3000
NODE_ENV=production
```

## 🚀 Deploy lên các nền tảng

### Option 1: Deploy lên Railway

1. **Đăng ký Railway**: https://railway.app
2. **Tạo project mới**
3. **Kết nối GitHub repository**
4. **Thêm MySQL database**:
   - Click "New" → "Database" → "MySQL"
   - Railway tự động tạo database và cung cấp connection string
5. **Cấu hình Environment Variables**:
   ```
   DB_HOST=<từ Railway MySQL>
   DB_PORT=3306
   DB_USER=<từ Railway MySQL>
   DB_PASSWORD=<từ Railway MySQL>
   DB_NAME=railway
   PORT=3000
   NODE_ENV=production
   ```
6. **Deploy**: Railway tự động deploy khi push code

**URL sau khi deploy**: `https://your-app.railway.app`

---

### Option 2: Deploy lên Render

1. **Đăng ký Render**: https://render.com
2. **Tạo Web Service mới**
3. **Kết nối GitHub repository**
4. **Cấu hình**:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Thêm MySQL database** (hoặc dùng external MySQL)
6. **Cấu hình Environment Variables** trong Render dashboard
7. **Deploy**

**URL sau khi deploy**: `https://your-app.onrender.com`

---

### Option 3: Deploy lên Heroku

1. **Cài đặt Heroku CLI**:
```bash
npm install -g heroku
```

2. **Login**:
```bash
heroku login
```

3. **Tạo app**:
```bash
heroku create your-app-name
```

4. **Thêm MySQL addon**:
```bash
heroku addons:create jawsdb:kitefin
```

5. **Cấu hình environment variables**:
```bash
heroku config:set NODE_ENV=production
```

6. **Deploy**:
```bash
git push heroku main
```

7. **Mở app**:
```bash
heroku open
```

**URL sau khi deploy**: `https://your-app-name.herokuapp.com`

---

### Option 4: Deploy lên VPS (Ubuntu)

#### Bước 1: Cài đặt môi trường

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Cài MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Cài PM2 (Process Manager)
sudo npm install -g pm2
```

#### Bước 2: Setup MySQL

```bash
# Login MySQL
sudo mysql -u root -p

# Tạo database và user
CREATE DATABASE project_mma;
CREATE USER 'mma_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON project_mma.* TO 'mma_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import tables
mysql -u mma_user -p project_mma < database.sql
```

#### Bước 3: Deploy code

```bash
# Clone repository
cd /var/www
sudo git clone <your-repo-url> medicine-api
cd medicine-api

# Install dependencies
npm install

# Tạo file .env
sudo nano .env
# Paste cấu hình và save (Ctrl+X, Y, Enter)

# Test chạy
npm start
```

#### Bước 4: Chạy với PM2

```bash
# Start app với PM2
pm2 start index.js --name medicine-api

# Auto start khi reboot
pm2 startup
pm2 save

# Xem logs
pm2 logs medicine-api

# Restart app
pm2 restart medicine-api
```

#### Bước 5: Setup Nginx (Reverse Proxy)

```bash
# Cài Nginx
sudo apt install nginx -y

# Tạo config
sudo nano /etc/nginx/sites-available/medicine-api
```

Paste config sau:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/medicine-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Bước 6: Setup SSL (HTTPS)

```bash
# Cài Certbot
sudo apt install certbot python3-certbot-nginx -y

# Tạo SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto renew
sudo certbot renew --dry-run
```

**URL sau khi deploy**: `https://your-domain.com`

---

## 🔒 Bảo mật

### 1. Thêm rate limiting

```bash
npm install express-rate-limit
```

Thêm vào `index.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100 // giới hạn 100 requests
});

app.use('/api/', limiter);
```

### 2. Thêm helmet (security headers)

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 3. Ẩn Swagger UI ở production

Trong `index.js`:
```javascript
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
}
```

---

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 monit
```

### Logs
```bash
# Xem logs
pm2 logs medicine-api

# Xem logs realtime
pm2 logs medicine-api --lines 100
```

---

## 🔄 Update Code

### Railway/Render/Heroku
```bash
git push origin main
# Tự động deploy
```

### VPS
```bash
cd /var/www/medicine-api
sudo git pull
npm install
pm2 restart medicine-api
```

---

## ✅ Kiểm tra sau khi deploy

1. **Test API**:
```bash
curl https://your-domain.com/
```

2. **Test Swagger UI**:
```
https://your-domain.com/api-docs
```

3. **Test endpoints**:
```bash
curl -H "x-user-id: user123" https://your-domain.com/api/medicines
```

---

## 🆘 Troubleshooting

### Lỗi kết nối database
- Kiểm tra environment variables
- Kiểm tra MySQL có chạy không: `sudo systemctl status mysql`
- Kiểm tra firewall

### App không start
- Xem logs: `pm2 logs`
- Kiểm tra port đã được sử dụng: `sudo lsof -i :3000`

### 502 Bad Gateway (Nginx)
- Kiểm tra app có chạy: `pm2 status`
- Restart Nginx: `sudo systemctl restart nginx`
