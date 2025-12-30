-- Add tip_amount column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0;

-- Index for tip reporting
CREATE INDEX IF NOT EXISTS idx_payments_tip ON payments(tip_amount) WHERE tip_amount > 0;
