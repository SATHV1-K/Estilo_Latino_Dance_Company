-- Migration: Add additional subscription card types
-- Adds Latin Rhythms/Kids and Gymnastics subscription cards

-- Update Hip Hop card name
UPDATE card_types 
SET name = 'Urban/Hip Hop Dance', 
    description = 'Urban/Hip Hop Dance Monthly Package - 1 Month Classes Pass'
WHERE name = 'Hip Hop Monthly' AND card_category = 'subscription';

-- Insert Latin Rhythms/Kids subscription card type
-- Price: $150, Validity: 1 month
INSERT INTO card_types (name, classes, expiration_months, price, price_per_class, description, is_active, card_category)
VALUES ('Latin Rhythms/Kids', 0, 1, 150.00, 0, 'Salsa - Bachata - Merengue Monthly Package - 1 Month Classes Pass', true, 'subscription')
ON CONFLICT DO NOTHING;

-- Insert Gymnastics subscription card type
-- Price: $95, Validity: 1 month
INSERT INTO card_types (name, classes, expiration_months, price, price_per_class, description, is_active, card_category)
VALUES ('Gymnastics', 0, 1, 95.00, 0, 'Gymnastics Monthly Package - 1 Month Classes Pass', true, 'subscription')
ON CONFLICT DO NOTHING;

-- Insert Gymnastics Kids subscription card type
-- Price: $45, Validity: 1 month
INSERT INTO card_types (name, classes, expiration_months, price, price_per_class, description, is_active, card_category)
VALUES ('Gymnastics Kids', 0, 1, 45.00, 0, 'Gymnastics Kids Monthly Package - 1 Month Classes Pass', true, 'subscription')
ON CONFLICT DO NOTHING;
