# POS System Backend - PHP & MySQL

## Setup Instructions

### 1. Database Setup

First, create the MySQL database and tables:

```bash
mysql -u root -p < api/database.sql
```

Or import via phpMyAdmin:
1. Open phpMyAdmin
2. Create a database named `pos_system`
3. Import `api/database.sql`

### 2. Configuration

Edit `api/config.php` to update your database credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'pos_system');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. Default Login

- **Email:** admin@konok.io
- **Password:** @rsm@k@1A

### 4. Web Server Configuration

#### Apache (with .htaccess)
Create `api/.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1.php [L,QSA]
```

#### Nginx
Add to your server block:
```nginx
location /api {
    try_files $uri $uri/ /api/index.php;
}
```

### 5. API Endpoints

#### Authentication
```
POST   /api/auth.php          - Login
DELETE /api/auth.php          - Logout
GET    /api/auth.php          - Check auth
```

#### Products
```
GET    /api/products.php      - List products
POST   /api/products.php      - Create product
PUT    /api/products.php      - Update product
DELETE /api/products.php?id=  - Delete product
```

#### Customers
```
GET    /api/customers.php     - List customers
POST   /api/customers.php     - Create customer
PUT    /api/customers.php     - Update customer
DELETE /api/customers.php?id= - Delete customer
```

#### Sales
```
GET    /api/sales.php         - List sales
POST   /api/sales.php         - Create sale
DELETE /api/sales.php?id=     - Delete sale
```

### 6. Response Format

All API responses follow this format:
```json
{
  "success": true,
  "data": {...},
  "error": null,
  "timestamp": "2024-01-01 12:00:00"
}
```

### 7. Authentication

Include the token in API requests:
```
Authorization: Bearer <token>
```

### 8. Security Notes

1. Change the default admin password immediately
2. Use HTTPS in production
3. Enable DEBUG_MODE = false in production
4. Consider adding rate limiting
5. Use prepared statements for all queries (already implemented)
