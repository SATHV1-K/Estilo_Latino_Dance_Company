-- Migration: Add tax columns to payments table
-- Run this in Supabase SQL Editor

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;

-- Update existing rows to set subtotal = amount (no tax was calculated before)
UPDATE payments 
SET subtotal = amount, tax_amount = 0 
WHERE subtotal IS NULL;

-- Make subtotal NOT NULL after populating existing rows
ALTER TABLE payments 
ALTER COLUMN subtotal SET NOT NULL;
