-- Migration: Add subscription card support
-- Adds card_category to distinguish punch cards from subscriptions
-- Creates Hip Hop Monthly subscription card

-- Add card_category column to card_types
ALTER TABLE card_types ADD COLUMN IF NOT EXISTS card_category TEXT DEFAULT 'punch_card';

-- Insert Hip Hop subscription card type
-- Price: $150, Validity: 1 month, Classes: 0 (unlimited for subscriptions)
INSERT INTO card_types (name, classes, expiration_months, price, price_per_class, description, is_active, card_category)
VALUES ('Hip Hop Monthly', 0, 1, 150.00, 0, 'Unlimited Hip Hop classes for one month', true, 'subscription')
ON CONFLICT DO NOTHING;

-- Update price_per_class description (not applicable for subscriptions)
COMMENT ON COLUMN card_types.card_category IS 'Type of card: punch_card (class-based) or subscription (time-based unlimited)';
