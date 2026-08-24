-- Remove shop name from sales
ALTER TABLE `Sales`
DROP COLUMN `shopName`;

-- Add payment tracking to sales
ALTER TABLE `Sales`
ADD COLUMN `paidAmount` INTEGER NOT NULL DEFAULT 0;

-- Add payment tracking to invoices
ALTER TABLE `Invoice`
ADD COLUMN `paidAmount` INTEGER NOT NULL DEFAULT 0;

-- Add payment status to invoices
ALTER TABLE `Invoice`
ADD COLUMN `paymentStatus` ENUM('UNPAID', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'UNPAID';

