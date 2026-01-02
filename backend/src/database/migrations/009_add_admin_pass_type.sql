-- Migration: Add Admin Pass card type
-- This card type is used when admins manually create passes for customers
-- It should be a regular punch_card type (not subscription)

INSERT INTO card_types (name, classes, expiration_months, price, price_per_class, description, is_active, card_category)
VALUES ('Admin Pass', 1, 3, 0.00, 0, 'Manually created pass by admin - classes and expiration set per customer', true, 'punch_card')
ON CONFLICT DO NOTHING;
