-- =====================================================
-- ESTILO LATINO DANCE STUDIO - DATABASE SCHEMA
-- PostgreSQL / Supabase
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
CREATE TYPE card_status AS ENUM ('active', 'expired', 'exhausted');
CREATE TYPE payment_method AS ENUM ('online', 'cash', 'admin_created');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE notification_type AS ENUM ('welcome', 'birthday', 'low_balance', 'expiring', 'expired', 'checkin');

-- =====================================================
-- USERS TABLE
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'customer' NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birthday DATE,
    qr_code VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FAMILY MEMBERS TABLE (Children under parent account)
-- =====================================================

CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birthday DATE,
    qr_code VARCHAR(255) UNIQUE,
    has_waiver BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CARD TYPES TABLE (The 5 punch card options)
-- =====================================================

CREATE TABLE card_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    classes INT NOT NULL,
    expiration_months INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    price_per_class DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PUNCH CARDS TABLE
-- =====================================================

CREATE TABLE punch_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    card_type_id UUID NOT NULL REFERENCES card_types(id),
    total_classes INT NOT NULL,
    classes_remaining INT NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiration_date DATE NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    status card_status DEFAULT 'active',
    payment_method payment_method NOT NULL,
    square_payment_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Either user_id or family_member_id must be set, not both
    CONSTRAINT card_owner_check CHECK (
        (user_id IS NOT NULL AND family_member_id IS NULL) OR
        (user_id IS NULL AND family_member_id IS NOT NULL)
    )
);

-- =====================================================
-- CHECK-INS TABLE (Attendance records)
-- =====================================================

CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    punch_card_id UUID REFERENCES punch_cards(id),
    is_birthday_checkin BOOLEAN DEFAULT FALSE,
    birthday_pass_id UUID,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    punched_by_user_id UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    
    CONSTRAINT checkin_person_check CHECK (
        (user_id IS NOT NULL AND family_member_id IS NULL) OR
        (user_id IS NULL AND family_member_id IS NOT NULL)
    )
);

-- =====================================================
-- WAIVERS TABLE
-- =====================================================

CREATE TABLE waivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    form_data JSONB NOT NULL,
    signature_url TEXT NOT NULL,
    pdf_storage_path TEXT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_sent BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT waiver_person_check CHECK (
        (user_id IS NOT NULL AND family_member_id IS NULL) OR
        (user_id IS NULL AND family_member_id IS NOT NULL)
    )
);

-- =====================================================
-- BIRTHDAY PASSES TABLE (One-day free class)
-- =====================================================

CREATE TABLE birthday_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    valid_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    check_in_id UUID REFERENCES check_ins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT birthday_pass_person_check CHECK (
        (user_id IS NOT NULL AND family_member_id IS NULL) OR
        (user_id IS NULL AND family_member_id IS NOT NULL)
    ),
    -- Prevent duplicate birthday passes for same person same day
    CONSTRAINT unique_birthday_pass_user UNIQUE (user_id, valid_date),
    CONSTRAINT unique_birthday_pass_member UNIQUE (family_member_id, valid_date)
);

-- =====================================================
-- PASSWORD RESET TOKENS TABLE
-- =====================================================

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    punch_card_id UUID REFERENCES punch_cards(id),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount DECIMAL(10,2) NOT NULL,  -- Total amount (subtotal + tax)
    square_payment_id VARCHAR(255),
    status payment_status DEFAULT 'pending',
    square_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE
-- =====================================================

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    marketing_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_prefs UNIQUE (user_id)
);

-- =====================================================
-- NOTIFICATION LOGS TABLE
-- =====================================================

CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    family_member_id UUID REFERENCES family_members(id),
    notification_type notification_type NOT NULL,
    channel VARCHAR(20) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    status VARCHAR(20) DEFAULT 'sent',
    external_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_qr_code ON users(qr_code);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_birthday ON users(EXTRACT(MONTH FROM birthday), EXTRACT(DAY FROM birthday));

CREATE INDEX idx_family_members_primary_user ON family_members(primary_user_id);
CREATE INDEX idx_family_members_qr_code ON family_members(qr_code);
CREATE INDEX idx_family_members_birthday ON family_members(EXTRACT(MONTH FROM birthday), EXTRACT(DAY FROM birthday));

CREATE INDEX idx_punch_cards_user ON punch_cards(user_id);
CREATE INDEX idx_punch_cards_family_member ON punch_cards(family_member_id);
CREATE INDEX idx_punch_cards_status ON punch_cards(status);
CREATE INDEX idx_punch_cards_expiration ON punch_cards(expiration_date);
CREATE INDEX idx_punch_cards_purchase_date ON punch_cards(purchase_date);

CREATE INDEX idx_check_ins_date ON check_ins(checked_in_at);
CREATE INDEX idx_check_ins_punch_card ON check_ins(punch_card_id);
CREATE INDEX idx_check_ins_user ON check_ins(user_id);
CREATE INDEX idx_check_ins_family_member ON check_ins(family_member_id);

CREATE INDEX idx_waivers_signed_at ON waivers(signed_at);
CREATE INDEX idx_waivers_user ON waivers(user_id);
CREATE INDEX idx_waivers_family_member ON waivers(family_member_id);

CREATE INDEX idx_birthday_passes_date ON birthday_passes(valid_date);
CREATE INDEX idx_birthday_passes_user ON birthday_passes(user_id);
CREATE INDEX idx_birthday_passes_family_member ON birthday_passes(family_member_id);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_date ON notification_logs(sent_at);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- =====================================================
-- SEED CARD TYPES (The 5 punch card options)
-- =====================================================

INSERT INTO card_types (name, classes, expiration_months, price, price_per_class, description) VALUES
    ('Single Class', 1, 1, 25.00, 25.00, 'Pay per class - 1 month expiration'),
    ('4 Classes Card', 4, 1, 95.00, 23.75, '1 month expiration from purchase'),
    ('8 Classes Card', 8, 1, 150.00, 18.75, '1 month expiration from purchase'),
    ('10 Classes Card', 10, 2, 195.00, 19.50, '2 months expiration from purchase'),
    ('15 Classes Card', 15, 2, 225.00, 15.00, '2 months expiration from purchase');

-- =====================================================
-- AUTO-UPDATE TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_punch_cards_updated_at 
    BEFORE UPDATE ON punch_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION TO EXPIRE CARDS (Run daily via cron)
-- =====================================================

CREATE OR REPLACE FUNCTION expire_punch_cards()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE punch_cards
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active'
    AND expiration_date < CURRENT_DATE;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION TO MARK EXHAUSTED CARDS
-- =====================================================

CREATE OR REPLACE FUNCTION mark_exhausted_cards()
RETURNS INTEGER AS $$
DECLARE
    exhausted_count INTEGER;
BEGIN
    UPDATE punch_cards
    SET status = 'exhausted', updated_at = NOW()
    WHERE status = 'active'
    AND classes_remaining <= 0;
    
    GET DIAGNOSTICS exhausted_count = ROW_COUNT;
    RETURN exhausted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be applied via Supabase dashboard or 
-- through the service role key which bypasses RLS
