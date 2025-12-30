-- Migration: Update 10-class card to 12-class card
-- This migration updates the card type from 10 classes to 12 classes
-- Run this in your Supabase SQL Editor

-- Update the card type that has 10 classes to have 12 classes
-- Also update the name to reflect the change
UPDATE card_types 
SET 
    classes = 12,
    name = CASE 
        WHEN name ILIKE '%10%class%' THEN REPLACE(REPLACE(name, '10', '12'), '10', '12')
        ELSE name
    END,
    updated_at = NOW()
WHERE classes = 10;

-- Verify the change
SELECT id, name, classes, price, expiration_months, is_active 
FROM card_types 
ORDER BY classes;
