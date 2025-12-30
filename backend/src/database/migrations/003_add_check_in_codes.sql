-- Migration: Add short check-in codes for easy lookup
-- Run this in Supabase SQL Editor

-- Add check_in_code column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS check_in_code VARCHAR(4) UNIQUE;

-- Add check_in_code column to family_members table
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS check_in_code VARCHAR(4) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_check_in_code ON users(check_in_code);
CREATE INDEX IF NOT EXISTS idx_family_members_check_in_code ON family_members(check_in_code);

-- Generate check-in codes for existing users who don't have one
-- This creates a 4-character alphanumeric code (A-Z, 0-9, excluding confusing chars like O, 0, I, 1)
CREATE OR REPLACE FUNCTION generate_check_in_code() RETURNS VARCHAR(4) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result VARCHAR(4) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..4 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing users with check-in codes
DO $$
DECLARE
    user_record RECORD;
    new_code VARCHAR(4);
    code_exists BOOLEAN;
BEGIN
    FOR user_record IN SELECT id FROM users WHERE check_in_code IS NULL LOOP
        LOOP
            new_code := generate_check_in_code();
            SELECT EXISTS(SELECT 1 FROM users WHERE check_in_code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        UPDATE users SET check_in_code = new_code WHERE id = user_record.id;
    END LOOP;
END $$;

-- Update existing family members with check-in codes
DO $$
DECLARE
    member_record RECORD;
    new_code VARCHAR(4);
    code_exists BOOLEAN;
BEGIN
    FOR member_record IN SELECT id FROM family_members WHERE check_in_code IS NULL LOOP
        LOOP
            new_code := generate_check_in_code();
            -- Check both tables to ensure uniqueness
            SELECT EXISTS(
                SELECT 1 FROM users WHERE check_in_code = new_code
                UNION
                SELECT 1 FROM family_members WHERE check_in_code = new_code
            ) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        UPDATE family_members SET check_in_code = new_code WHERE id = member_record.id;
    END LOOP;
END $$;
