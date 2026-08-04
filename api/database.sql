-- =====================================================
-- POS System Database Schema
-- MySQL Database Setup
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pos_system;

-- =====================================================
-- Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'operator') DEFAULT 'operator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default Super Admin (password: @rsm@k@1A)
INSERT INTO users (id, name, email, password, role) VALUES 
('super_admin', 'Super Admin', 'admin@konok.io', '@rsm@k@1A', 'super_admin')
ON DUPLICATE KEY UPDATE name = name;

-- =====================================================
-- Categories Table
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Suppliers Table
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    company VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Products Table
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cat VARCHAR(255),
    company VARCHAR(255),
    stock INT DEFAULT 0,
    buyP DECIMAL(15,2) DEFAULT 0,
    sellP DECIMAL(15,2) DEFAULT 0,
    mrp DECIMAL(15,2) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'পিস',
    barcode VARCHAR(100),
    image TEXT,
    minStock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- Customers Table
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    email VARCHAR(255),
    balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Sales Table
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    items TEXT NOT NULL, -- JSON array of sale items
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    vat DECIMAL(15,2) DEFAULT 0,
    vatRate DECIMAL(5,2) DEFAULT 0,
    paid DECIMAL(15,2) DEFAULT 0,
    due DECIMAL(15,2) DEFAULT 0,
    customer_id VARCHAR(50),
    payment_method ENUM('cash', 'mobile', 'card', 'mixed') DEFAULT 'cash',
    invoice_number VARCHAR(50),
    user_id VARCHAR(50),
    user_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- =====================================================
-- Purchases Table
-- =====================================================
CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(50) PRIMARY KEY,
    items TEXT NOT NULL, -- JSON array of purchase items
    subtotal DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    paid DECIMAL(15,2) DEFAULT 0,
    due DECIMAL(15,2) DEFAULT 0,
    supplier_id VARCHAR(50),
    invoice_number VARCHAR(50),
    user_id VARCHAR(50),
    user_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- =====================================================
-- Expenses Table
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    note TEXT,
    user_id VARCHAR(50),
    user_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Incomes Table
-- =====================================================
CREATE TABLE IF NOT EXISTS incomes (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    note TEXT,
    user_id VARCHAR(50),
    user_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Product History Table (for stock tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_history (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(255),
    type ENUM('purchase', 'sale', 'adjustment') NOT NULL,
    quantity INT NOT NULL,
    stock_before INT,
    stock_after INT,
    note TEXT,
    user_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =====================================================
-- Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('name', 'আপনার দোকান'),
('address', ''),
('phone', ''),
('email', ''),
('taxId', ''),
('crNumber', ''),
('vatEnabled', 'true'),
('vatPercent', '15'),
('bannerImage', '')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- =====================================================
-- Sessions Table (for token management)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- Indexes for better performance
-- =====================================================
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_purchases_date ON purchases(created_at);
CREATE INDEX idx_sessions_token ON sessions(token);
