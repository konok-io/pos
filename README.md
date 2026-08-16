# Product Import System

A CSV-based product import system using sql.js (SQLite in the browser).

## Bug Fix

### Issue
Products were being incorrectly skipped during CSV import when the barcode existed in the database but belonged to a different company.

**Previous behavior:**
```
Skipped (barcode exists different company): Mini Rice 10kg
Skipped (barcode exists different company): Suzi Chips
Skipped (barcode exists different company): Suzi Biscuit
Skipped (barcode exists different company): Al-Marwa Spice
Final: items= 0 errors= 0 skipped= 5
```

### Solution
Modified the import logic to only skip products when **both** barcode AND company match (true duplicates). If a barcode exists but belongs to a different company, the product is now imported as a new entry.

**New behavior:**
- **Skip**: Barcode AND Company both match (duplicate entry)
- **Import**: Barcode exists but Company is different (new product from different company)
- **Import**: Barcode doesn't exist (new product)

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

Then open http://localhost:3000 in your browser.

## Usage

1. Upload a CSV file with the following columns:
   - Product Name
   - Company
   - Category
   - Barcode
   - Unit
   - PurchasePrice
   - SalesPrice
   - VAT%
   - Stock
   - MinStock

2. Click "Import Products" to import the products

3. View the results and all imported products

## Sample Data

A sample CSV file (`public/sample-products.csv`) is included for testing.
