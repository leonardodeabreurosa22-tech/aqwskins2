-- AQW SKINS DATABASE SCHEMA
-- PostgreSQL / Neon Database
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  balance DECIMAL(10, 2) DEFAULT 0.00,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  total_deposited DECIMAL(10, 2) DEFAULT 0.00,
  total_withdrawn INTEGER DEFAULT 0,
  profile_picture VARCHAR(500),
  preferred_language VARCHAR(10) DEFAULT 'en',
  preferred_currency VARCHAR(5) DEFAULT 'USD',
  email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- ITEMS TABLE (AQW Skins/Codes)
-- ============================================================================
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  value DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  requires_deposit BOOLEAN DEFAULT FALSE,
  times_won INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_rarity ON items(rarity);
CREATE INDEX idx_items_status ON items(status);

-- ============================================================================
-- ITEM CODES TABLE (Stock Management)
-- ============================================================================
CREATE TABLE item_codes (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  code VARCHAR(500) NOT NULL,
  batch_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'used')),
  used_by_user_id INTEGER REFERENCES users(id),
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_item_codes_item_id ON item_codes(item_id);
CREATE INDEX idx_item_codes_status ON item_codes(status);
CREATE INDEX idx_item_codes_batch_id ON item_codes(batch_id);

-- ============================================================================
-- LOOTBOXES TABLE
-- ============================================================================
CREATE TABLE lootboxes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  category VARCHAR(50),
  min_level INTEGER DEFAULT 1,
  items JSONB NOT NULL, -- Array of {id, weight}
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'coming_soon')),
  times_opened INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lootboxes_status ON lootboxes(status);
CREATE INDEX idx_lootboxes_category ON lootboxes(category);

-- ============================================================================
-- INVENTORY TABLE
-- ============================================================================
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('lootbox', 'coupon', 'exchange', 'admin')),
  source_id INTEGER,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'pending_withdrawal', 'withdrawn', 'exchanged')),
  obtained_at TIMESTAMP DEFAULT NOW(),
  withdrawn_at TIMESTAMP
);

CREATE INDEX idx_inventory_user_id ON inventory(user_id);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_source_type ON inventory(source_type);

-- ============================================================================
-- LOOTBOX OPENINGS LOG (Fairness Audit)
-- ============================================================================
CREATE TABLE lootbox_openings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  lootbox_id INTEGER NOT NULL REFERENCES lootboxes(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  price_paid DECIMAL(10, 2) NOT NULL,
  fairness_hash VARCHAR(255) NOT NULL,
  fairness_data JSONB NOT NULL,
  fingerprint VARCHAR(255),
  opened_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lootbox_openings_user_id ON lootbox_openings(user_id);
CREATE INDEX idx_lootbox_openings_lootbox_id ON lootbox_openings(lootbox_id);
CREATE INDEX idx_lootbox_openings_opened_at ON lootbox_openings(opened_at);

-- ============================================================================
-- DEPOSITS TABLE
-- ============================================================================
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount_original DECIMAL(10, 2) NOT NULL,
  currency_original VARCHAR(5) NOT NULL,
  amount_usd DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB,
  payment_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_created_at ON deposits(created_at);

-- ============================================================================
-- WITHDRAWALS TABLE
-- ============================================================================
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  inventory_item_id INTEGER NOT NULL REFERENCES inventory(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'pending_manual', 'failed')),
  delivered_code TEXT,
  processed_by_admin_id INTEGER REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at);

-- ============================================================================
-- EXCHANGES TABLE
-- ============================================================================
CREATE TABLE exchanges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  source_item_ids INTEGER[] NOT NULL,
  target_item_id INTEGER NOT NULL REFERENCES items(id),
  source_value DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) NOT NULL,
  net_value DECIMAL(10, 2) NOT NULL,
  target_value DECIMAL(10, 2) NOT NULL,
  fingerprint VARCHAR(255),
  exchanged_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exchanges_user_id ON exchanges(user_id);
CREATE INDEX idx_exchanges_exchanged_at ON exchanges(exchanged_at);

-- ============================================================================
-- COUPONS TABLE (Influencer Codes)
-- ============================================================================
CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  influencer_name VARCHAR(255) NOT NULL,
  influencer_url VARCHAR(500),
  lootbox_config JSONB NOT NULL, -- {items: [{id, weight}]}
  minimum_deposit_required DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by_admin_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);

-- ============================================================================
-- COUPON USAGE TABLE (Anti-Abuse)
-- ============================================================================
CREATE TABLE coupon_usage (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id),
  user_id INTEGER REFERENCES users(id),
  fingerprint VARCHAR(255) NOT NULL,
  item_won_id INTEGER NOT NULL REFERENCES items(id),
  fairness_hash VARCHAR(255) NOT NULL,
  used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_fingerprint ON coupon_usage(fingerprint);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);

-- ============================================================================
-- TICKETS TABLE (Support System)
-- ============================================================================
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'closed')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to_id ON tickets(assigned_to_id);

-- ============================================================================
-- TICKET MESSAGES TABLE
-- ============================================================================
CREATE TABLE ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- ADMIN SETTINGS TABLE
-- ============================================================================
CREATE TABLE admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by_admin_id INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lootboxes_updated_at BEFORE UPDATE ON lootboxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default admin user (password: Admin123!@# - CHANGE THIS!)
INSERT INTO users (username, email, password_hash, role, email_verified)
VALUES ('admin', 'admin@aqw-skins.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVpLMjxR45e', 'admin', TRUE);

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description)
VALUES 
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('registration_enabled', 'true', 'Enable/disable user registration'),
  ('deposits_enabled', 'true', 'Enable/disable deposits'),
  ('withdrawals_enabled', 'true', 'Enable/disable withdrawals'),
  ('exchanger_enabled', 'true', 'Enable/disable item exchanger'),
  ('exchange_fee_percentage', '0.05', 'Exchange fee percentage (0.05 = 5%)'),
  ('minimum_withdrawal_level', '1', 'Minimum user level to withdraw');

-- ============================================================================
-- VIEWS
-- ============================================================================

-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id,
  u.username,
  u.balance,
  u.total_deposited,
  u.total_withdrawn,
  COUNT(DISTINCT lo.id) as total_openings,
  COUNT(DISTINCT inv.id) as total_items,
  COUNT(DISTINCT w.id) as total_withdrawals,
  COUNT(DISTINCT e.id) as total_exchanges
FROM users u
LEFT JOIN lootbox_openings lo ON u.id = lo.user_id
LEFT JOIN inventory inv ON u.id = inv.user_id
LEFT JOIN withdrawals w ON u.id = w.user_id
LEFT JOIN exchanges e ON u.id = e.user_id
GROUP BY u.id, u.username, u.balance, u.total_deposited, u.total_withdrawn;

-- Item stock view
CREATE OR REPLACE VIEW item_stock AS
SELECT 
  i.id,
  i.name,
  i.rarity,
  i.value,
  COUNT(ic.id) FILTER (WHERE ic.status = 'available') as available_codes,
  COUNT(ic.id) FILTER (WHERE ic.status = 'used') as used_codes,
  i.times_won
FROM items i
LEFT JOIN item_codes ic ON i.id = ic.item_id
GROUP BY i.id, i.name, i.rarity, i.value, i.times_won;

COMMENT ON DATABASE aqw_skins IS 'AQW Skins Loot Box System - Provably Fair, Multi-Currency, International';
