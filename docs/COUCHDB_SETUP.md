# CouchDB Setup Guide for Hostinger VPS

## SSH দিয়ে VPS এ প্রবেশ করুন

```bash
ssh root@your-vps-ip
```

---

## ১. সিস্টেম আপডেট করুন

```bash
apt update && apt upgrade -y
```

---

## ২. CouchDB ইনস্টল করুন

### Ubuntu 22.04 এর জন্য:

```bash
# Add CouchDB repository
echo "deb https://apache.jfrog.io/artifactory/couchdb-deb/ jammy main" | tee /etc/apt/sources.list.d/couchdb.list

# Add signing key
curl -fsSL https://apache.jfrog.io/artifactory/couchdb-deb/jammy/key | gpg --dearmor | tee /etc/apt/trusted.gpg.d/couchdb.gpg > /dev/null

# Update and install
apt update
apt install -y couchdb
```

---

## ৩. CouchDB কনফিগার করুন

ইনস্টল করার সময় প্রম্পট আসবে:

```
Configuration Mode: Standalone
Bind Address: 0.0.0.0
CouchDB Username: admin
CouchDB Password: your_secure_password
```

**⚠️ একটি শক্তিশালী পাসওয়ার্ড দিন!**

---

## ৪. ম্যানুয়ালি কনফিগার করতে চাইলে:

```bash
nano /opt/couchdb/etc/local.d/local.ini
```

এই পরিবর্তন করুন:

```ini
[couchdb]
single_node=true

[chttpd]
bind_address = 0.0.0.0
port = 5984

[cors]
origins = *
credentials = true
```

---

## ৫. CouchDB রিস্টার্ট করুন

```bash
systemctl restart couchdb
systemctl status couchdb
```

---

## ৬. ফায়ারওয়াল কনফিগার করুন

```bash
ufw allow 22/tcp    # SSH
ufw allow 5984/tcp  # CouchDB
ufw enable
```

---

## ৭. SSL সার্টিফিকেট (HTTPS এর জন্য)

### Nginx + Certbot ইনস্টল করুন:
```bash
apt install -y nginx certbot python3-certbot-nginx
```

### Nginx কনফিগার করুন:
```bash
nano /etc/nginx/sites-available/couchdb
```

এই কন্টেন্ট পেস্ট করুন:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5984;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/couchdb /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### SSL সার্টিফিকেট নিন:
```bash
certbot --nginx -d your-domain.com
```

---

## ৮. টেস্ট করুন

```bash
curl http://localhost:5984
```

রেসপন্স:
```json
{"couchdb":"Welcome","version":"3.3.2",...}
```

Fauxton (Admin UI): `http://your-domain.com/_utils/`

---

## ৯. ডাটাবেস তৈরি করুন

```bash
curl -X PUT http://admin:password@localhost:5984/pos_management
```

---

## ১০. POS App এ কানেক্ট করুন

Database Settings এ এই URL দিন:

```
https://your-domain.com/pos_management
```

---

## Quick Setup Script (Copy-Paste করুন)

```bash
#!/bin/bash
echo "=== CouchDB Setup Started ==="

apt update && apt upgrade -y

echo "deb https://apache.jfrog.io/artifactory/couchdb-deb/ jammy main" | tee /etc/apt/sources.list.d/couchdb.list
curl -fsSL https://apache.jfrog.io/artifactory/couchdb-deb/jammy/key | gpg --dearmor | tee /etc/apt/trusted.gpg.d/couchdb.gpg > /dev/null

apt update
DEBIAN_FRONTEND=noninteractive apt install -y couchdb

systemctl restart couchdb
systemctl enable couchdb

echo "=== CouchDB Setup Complete ==="
```

---

## সাহায্য প্রয়োজন?

কোনো স্টেপে সমস্যা হলে বলুন! 🚀
