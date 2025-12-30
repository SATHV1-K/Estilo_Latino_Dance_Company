-- Add first_name and last_name columns to waivers, punch_cards, and payments tables
-- This allows for easier reporting without joins to users table

-- Add columns to waivers table
ALTER TABLE waivers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE waivers ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add columns to punch_cards table
ALTER TABLE punch_cards ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE punch_cards ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Backfill existing records from users table
UPDATE waivers w
SET first_name = u.first_name, last_name = u.last_name
FROM users u
WHERE w.user_id = u.id AND (w.first_name IS NULL OR w.last_name IS NULL);

UPDATE punch_cards pc
SET first_name = u.first_name, last_name = u.last_name
FROM users u
WHERE pc.user_id = u.id AND (pc.first_name IS NULL OR pc.last_name IS NULL);

UPDATE payments p
SET first_name = u.first_name, last_name = u.last_name
FROM users u
WHERE p.user_id = u.id AND (p.first_name IS NULL OR p.last_name IS NULL);
