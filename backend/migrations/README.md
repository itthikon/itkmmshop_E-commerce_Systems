# Accounting System Migrations

This directory contains database migration scripts for the accounting system.

## Overview

The accounting system adds three new tables to the database:
- `transaction_categories` - Categories for income and expense transactions
- `transactions` - All financial transactions (income and expenses)
- `accounting_settings` - System-wide accounting configuration

## Running Migrations

### Run All Migrations (Recommended)

To run all accounting system migrations in the correct order:

```bash
cd backend/migrations
node run-accounting-migrations.js up
```

This will:
1. Create the `transaction_categories` table
2. Create the `accounting_settings` table
3. Create the `transactions` table
4. Add all foreign key constraints
5. Seed default income and expense categories

### Rollback All Migrations

To remove all accounting system tables:

```bash
cd backend/migrations
node run-accounting-migrations.js down
```

## Individual Migrations

You can also run migrations individually if needed:

### Create transaction_categories table
```bash
node create-transaction-categories-table.js up
node create-transaction-categories-table.js down  # rollback
```

### Create accounting_settings table
```bash
node create-accounting-settings-table.js up
node create-accounting-settings-table.js down  # rollback
```

### Create transactions table
```bash
node create-transactions-table.js up
node create-transactions-table.js down  # rollback
```

### Seed default categories
```bash
node seed-default-categories.js seed
node seed-default-categories.js unseed  # remove seeded data
```

## Default Categories

The system seeds the following default categories:

### Income Categories (3)
- **ขายสินค้า** (Sales) - รายได้จากการขายสินค้า
- **ดอกเบี้ย** (Interest) - ดอกเบี้ยรับ
- **รายได้อื่นๆ** (Other Income) - รายได้อื่นๆ

### Expense Categories (8)
- **ซื้อสินค้า** (Cost of Goods) - ต้นทุนสินค้า
- **ค่าเช่า** (Rent) - ค่าเช่าสถานที่
- **ค่าไฟฟ้า** (Electricity) - ค่าไฟฟ้า
- **ค่าน้ำประปา** (Water) - ค่าน้ำประปา
- **ค่าขนส่ง** (Shipping) - ค่าขนส่งสินค้า
- **ค่าโฆษณา** (Advertising) - ค่าโฆษณาและการตลาด
- **เงินเดือน** (Salary) - เงินเดือนพนักงาน
- **ค่าใช้จ่ายอื่นๆ** (Other Expenses) - ค่าใช้จ่ายอื่นๆ

## Database Schema

### transactions table
- Stores all income and expense transactions
- Links to orders for auto-generated sales transactions
- Supports soft deletes (deleted_at)
- Includes audit trail (created_by, created_at, updated_at)

### transaction_categories table
- Stores categories for transactions
- Supports both income and expense types
- System categories cannot be deleted
- Categories can be deactivated instead of deleted

### accounting_settings table
- Stores system-wide accounting configuration
- Key-value pairs for settings like opening balance, fiscal year, etc.

## Foreign Key Constraints

The migrations automatically create the following foreign key relationships:

- `transactions.category_id` → `transaction_categories.id`
- `transactions.created_by` → `users.id`
- `transactions.reference_id` → `orders.id` (nullable, ON DELETE SET NULL)
- `accounting_settings.updated_by` → `users.id`

## Verification

After running migrations, you can verify the tables were created:

```bash
mysql -u root -p -D itkmmshop22 -e "SHOW TABLES;"
```

Check the transactions table structure:

```bash
mysql -u root -p -D itkmmshop22 -e "DESCRIBE transactions;"
```

View seeded categories:

```bash
mysql -u root -p -D itkmmshop22 -e "SELECT * FROM transaction_categories;"
```

## Requirements

- MySQL 5.7 or higher
- Node.js 14 or higher
- mysql2 package installed
- dotenv package installed
- Valid database credentials in `backend/.env`

## Troubleshooting

### Access Denied Error
Make sure your `.env` file has the correct database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=itkmmshop22
```

### Table Already Exists
If you get "table already exists" errors, you can either:
1. Run the rollback first: `node run-accounting-migrations.js down`
2. Or manually drop the tables and run again

### Foreign Key Constraint Errors
Make sure the `users` and `orders` tables exist before running the migrations.
