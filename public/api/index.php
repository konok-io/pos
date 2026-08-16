<?php
/**
 * POS System API
 * 
 * Welcome to the POS System API
 * 
 * Available endpoints:
 * 
 * Authentication:
 * POST   /api/auth.php          - Login
 * DELETE /api/auth.php          - Logout
 * GET    /api/auth.php          - Check auth status
 * 
 * Products:
 * GET    /api/products.php      - Get all products
 * POST   /api/products.php      - Create product
 * PUT    /api/products.php      - Update product
 * DELETE /api/products.php?id=  - Delete product
 * 
 * Customers:
 * GET    /api/customers.php     - Get all customers
 * POST   /api/customers.php     - Create customer
 * PUT    /api/customers.php     - Update customer
 * DELETE /api/customers.php?id= - Delete customer
 * 
 * Sales:
 * GET    /api/sales.php         - Get all sales
 * POST   /api/sales.php         - Create sale
 * DELETE /api/sales.php?id=     - Delete sale
 * 
 * Purchases:
 * GET    /api/purchases.php     - Get all purchases
 * POST   /api/purchases.php     - Create purchase
 * DELETE /api/purchases.php?id= - Delete purchase
 * 
 * Suppliers:
 * GET    /api/suppliers.php     - Get all suppliers
 * POST   /api/suppliers.php     - Create supplier
 * PUT    /api/suppliers.php     - Update supplier
 * DELETE /api/suppliers.php?id= - Delete supplier
 * 
 * Categories:
 * GET    /api/categories.php    - Get all categories
 * POST   /api/categories.php   - Create category
 * PUT    /api/categories.php   - Update category
 * DELETE /api/categories.php?id= - Delete category
 * 
 * Expenses & Incomes:
 * GET    /api/expenses.php?type=expenses     - Get expenses
 * POST   /api/expenses.php?type=expenses     - Create expense
 * DELETE /api/expenses.php?type=expenses&id= - Delete expense
 * GET    /api/expenses.php?type=incomes      - Get incomes
 * POST   /api/expenses.php?type=incomes      - Create income
 * DELETE /api/expenses.php?type=incomes&id=  - Delete income
 * 
 * Users (Super Admin only):
 * GET    /api/users.php         - Get all users
 * POST   /api/users.php         - Create user
 * PUT    /api/users.php         - Update user
 * DELETE /api/users.php?id=      - Delete user
 * 
 * Settings:
 * GET    /api/settings.php       - Get all settings
 * POST   /api/settings.php      - Update settings
 * 
 * Authentication:
 * Include header: Authorization: Bearer <token>
 * 
 * Database Setup:
 * Run database.sql to create the database and tables.
 */

header('Content-Type: application/json; charset=utf-8');

response([
    'name' => 'POS System API',
    'version' => '1.0',
    'endpoints' => [
        'auth' => '/api/auth.php',
        'products' => '/api/products.php',
        'customers' => '/api/customers.php',
        'sales' => '/api/sales.php',
        'purchases' => '/api/purchases.php',
        'suppliers' => '/api/suppliers.php',
        'categories' => '/api/categories.php',
        'expenses' => '/api/expenses.php',
        'users' => '/api/users.php',
        'settings' => '/api/settings.php'
    ]
]);
