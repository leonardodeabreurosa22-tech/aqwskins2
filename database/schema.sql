-- AQW SKINS DATABASE SCHEMA
-- PostgreSQL / Neon Database
-- Version: 1.0.0

-- ============================================================================
-- DROP ALL EXISTING TABLES (CUIDADO: APAGA TUDO!)
-- ============================================================================
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS exchanges CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS lootbox_openings CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS item_codes CASCADE;
DROP TABLE IF EXISTS lootboxes CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP VIEW IF EXISTS user_statistics CASCADE;
DROP VIEW IF EXISTS item_stock CASCADE;

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
-- SAMPLE ITEMS (Placeholders)
-- ============================================================================
INSERT INTO items (name, description, category, rarity, value, image_url, requires_deposit, status) VALUES
-- Mythic Items
('Drakath''s Armor', 'Legendary armor worn by Drakath himself', 'Armor', 'mythic', 500.00, 'https://images.unsplash.com/photo-1589254066213-a0c9dc853511?w=400', TRUE, 'active'),
('Sepulchure''s Helm', 'The dark helmet of the DoomKnight', 'Helmet', 'mythic', 450.00, 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400', TRUE, 'active'),
('Artix''s Paladin Blade', 'The holy blade of the Paladin champion', 'Weapon', 'mythic', 600.00, 'https://images.unsplash.com/photo-1597305877032-0668b3c3bc3e?w=400', TRUE, 'active'),

-- Legendary Items
('Chaos Lord Wings', 'Wings infused with chaotic energy', 'Cape', 'legendary', 250.00, 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', TRUE, 'active'),
('Dragon Slayer Set', 'Complete armor set for dragon hunters', 'Armor', 'legendary', 300.00, 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=400', TRUE, 'active'),
('Necromancer Staff', 'Staff that channels dark magic', 'Weapon', 'legendary', 280.00, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', TRUE, 'active'),
('Void Knight Armor', 'Armor from the Void dimension', 'Armor', 'legendary', 320.00, 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400', TRUE, 'active'),

-- Epic Items
('Undead Warrior Set', 'Armor set for the undead legion', 'Armor', 'epic', 120.00, 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400', TRUE, 'active'),
('Firestorm Blade', 'Sword engulfed in eternal flames', 'Weapon', 'epic', 100.00, 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400', FALSE, 'active'),
('Celestial Wings', 'Wings blessed by the heavens', 'Cape', 'epic', 150.00, 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=400', TRUE, 'active'),
('Shadow Assassin Hood', 'Hood that grants stealth abilities', 'Helmet', 'epic', 90.00, 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=400', FALSE, 'active'),
('Thunder Knight Hammer', 'Hammer that summons lightning', 'Weapon', 'epic', 110.00, 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=400', FALSE, 'active'),

-- Rare Items
('Guardian Plate', 'Sturdy armor for defenders', 'Armor', 'rare', 50.00, 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400', FALSE, 'active'),
('Mystic Orb Staff', 'Staff with a glowing mystic orb', 'Weapon', 'rare', 45.00, 'https://images.unsplash.com/photo-1579618216077-3fac6c582dec?w=400', FALSE, 'active'),
('Phoenix Feather Cape', 'Cape made from phoenix feathers', 'Cape', 'rare', 55.00, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', FALSE, 'active'),
('Berserker Axe', 'Powerful two-handed axe', 'Weapon', 'rare', 48.00, 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400', FALSE, 'active'),
('Ice Mage Robes', 'Robes that resist cold damage', 'Armor', 'rare', 52.00, 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=400', FALSE, 'active'),

-- Uncommon Items
('Knight Sword', 'Standard issue knight sword', 'Weapon', 'uncommon', 20.00, 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=400', FALSE, 'active'),
('Leather Armor', 'Light protective leather armor', 'Armor', 'uncommon', 22.00, 'https://images.unsplash.com/photo-1579790781308-d0c68f5e4eb6?w=400', FALSE, 'active'),
('Battle Helmet', 'Basic protective helmet', 'Helmet', 'uncommon', 18.00, 'https://images.unsplash.com/photo-1580211686797-e0c1fc65d93b?w=400', FALSE, 'active'),
('Traveler''s Cloak', 'Simple cloak for travelers', 'Cape', 'uncommon', 15.00, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', FALSE, 'active'),
('Wooden Shield', 'Basic wooden shield', 'Shield', 'uncommon', 16.00, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', FALSE, 'active'),

-- Common Items
('Rusty Sword', 'Old rusty sword for beginners', 'Weapon', 'common', 5.00, 'https://images.unsplash.com/photo-1591465291914-9e4050b6dcdc?w=400', FALSE, 'active'),
('Cloth Armor', 'Basic cloth protection', 'Armor', 'common', 4.00, 'https://images.unsplash.com/photo-1571867424488-4565932edb41?w=400', FALSE, 'active'),
('Apprentice Staff', 'Training staff for mages', 'Weapon', 'common', 6.00, 'https://images.unsplash.com/photo-1579618215542-2ed5e10b65ed?w=400', FALSE, 'active'),
('Simple Cape', 'Plain cape with no special abilities', 'Cape', 'common', 3.00, 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400', FALSE, 'active'),
('Iron Dagger', 'Small iron dagger', 'Weapon', 'common', 5.50, 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400', FALSE, 'active'),
('Leather Gloves', 'Basic hand protection', 'Gloves', 'common', 4.50, 'https://images.unsplash.com/photo-1579818122837-7d4e0a3d6d26?w=400', FALSE, 'active'),
('Wooden Bow', 'Simple wooden bow', 'Weapon', 'common', 6.50, 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400', FALSE, 'active');

-- ============================================================================
-- SAMPLE ITEM CODES (Stock for items)
-- ============================================================================
-- Codes para Mythic items (poucos)
INSERT INTO item_codes (item_id, code, batch_id, status) VALUES
(1, 'DRAKATH-ARMOR-2024-A1B2C3', 'BATCH_MYTHIC_001', 'available'),
(1, 'DRAKATH-ARMOR-2024-D4E5F6', 'BATCH_MYTHIC_001', 'available'),
(2, 'SEPULCHURE-HELM-2024-G7H8I9', 'BATCH_MYTHIC_002', 'available'),
(3, 'ARTIX-BLADE-2024-J1K2L3', 'BATCH_MYTHIC_003', 'available');

-- Codes para Legendary items (médio)
INSERT INTO item_codes (item_id, code, batch_id, status) VALUES
(4, 'CHAOS-WINGS-2024-M4N5O6', 'BATCH_LEGEND_001', 'available'),
(4, 'CHAOS-WINGS-2024-P7Q8R9', 'BATCH_LEGEND_001', 'available'),
(5, 'DRAGON-SET-2024-S1T2U3', 'BATCH_LEGEND_002', 'available'),
(5, 'DRAGON-SET-2024-V4W5X6', 'BATCH_LEGEND_002', 'available'),
(6, 'NECRO-STAFF-2024-Y7Z8A9', 'BATCH_LEGEND_003', 'available'),
(7, 'VOID-ARMOR-2024-B1C2D3', 'BATCH_LEGEND_004', 'available');

-- Codes para Epic items (muitos)
INSERT INTO item_codes (item_id, code, batch_id, status)
SELECT 
  item_id,
  'EPIC-CODE-' || item_id || '-' || generate_series || '-' || substr(md5(random()::text), 1, 8),
  'BATCH_EPIC_' || item_id,
  'available'
FROM generate_series(1, 5), (SELECT id as item_id FROM items WHERE rarity = 'epic') sub;

-- Codes para Rare items (muitos)
INSERT INTO item_codes (item_id, code, batch_id, status)
SELECT 
  item_id,
  'RARE-CODE-' || item_id || '-' || generate_series || '-' || substr(md5(random()::text), 1, 8),
  'BATCH_RARE_' || item_id,
  'available'
FROM generate_series(1, 10), (SELECT id as item_id FROM items WHERE rarity = 'rare') sub;

-- Codes para Uncommon items (muito mais)
INSERT INTO item_codes (item_id, code, batch_id, status)
SELECT 
  item_id,
  'UNCOMMON-CODE-' || item_id || '-' || generate_series || '-' || substr(md5(random()::text), 1, 8),
  'BATCH_UNCOMMON_' || item_id,
  'available'
FROM generate_series(1, 20), (SELECT id as item_id FROM items WHERE rarity = 'uncommon') sub;

-- Codes para Common items (infinito)
INSERT INTO item_codes (item_id, code, batch_id, status)
SELECT 
  item_id,
  'COMMON-CODE-' || item_id || '-' || generate_series || '-' || substr(md5(random()::text), 1, 8),
  'BATCH_COMMON_' || item_id,
  'available'
FROM generate_series(1, 50), (SELECT id as item_id FROM items WHERE rarity = 'common') sub;

-- ============================================================================
-- SAMPLE LOOTBOXES (Placeholders)
-- ============================================================================
INSERT INTO lootboxes (name, description, price, image_url, category, min_level, items, status) VALUES
-- Starter Box
('Starter Box', 'Perfect for beginners! Contains common and uncommon items.', 5.00, 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400', 'starter', 1,
'[
  {"id": 22, "weight": 40},
  {"id": 23, "weight": 35},
  {"id": 24, "weight": 30},
  {"id": 25, "weight": 25},
  {"id": 26, "weight": 20},
  {"id": 17, "weight": 15},
  {"id": 18, "weight": 12},
  {"id": 19, "weight": 10},
  {"id": 20, "weight": 8},
  {"id": 21, "weight": 5}
]'::jsonb, 'active'),

-- Warrior Box
('Warrior Box', 'Contains powerful weapons and armor for warriors!', 15.00, 'https://images.unsplash.com/photo-1589254066213-a0c9dc853511?w=400', 'warrior', 1,
'[
  {"id": 13, "weight": 25},
  {"id": 14, "weight": 25},
  {"id": 16, "weight": 20},
  {"id": 9, "weight": 15},
  {"id": 12, "weight": 12},
  {"id": 5, "weight": 8},
  {"id": 7, "weight": 5},
  {"id": 1, "weight": 2}
]'::jsonb, 'active'),

-- Mage Box
('Mage Box', 'Mystical items for spellcasters and mages!', 15.00, 'https://images.unsplash.com/photo-1579618216077-3fac6c582dec?w=400', 'mage', 1,
'[
  {"id": 14, "weight": 30},
  {"id": 24, "weight": 25},
  {"id": 15, "weight": 20},
  {"id": 11, "weight": 15},
  {"id": 6, "weight": 10},
  {"id": 2, "weight": 5}
]'::jsonb, 'active'),

-- Premium Box
('Premium Box', 'High chance of epic and legendary items!', 50.00, 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=400', 'premium', 5,
'[
  {"id": 8, "weight": 20},
  {"id": 9, "weight": 20},
  {"id": 10, "weight": 18},
  {"id": 11, "weight": 18},
  {"id": 12, "weight": 15},
  {"id": 4, "weight": 10},
  {"id": 5, "weight": 10},
  {"id": 6, "weight": 8},
  {"id": 7, "weight": 7},
  {"id": 1, "weight": 2},
  {"id": 2, "weight": 2},
  {"id": 3, "weight": 1}
]'::jsonb, 'active'),

-- Legendary Box
('Legendary Box', 'The ultimate box! Best chance for mythic items!', 100.00, 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', 'ultimate', 10,
'[
  {"id": 4, "weight": 25},
  {"id": 5, "weight": 25},
  {"id": 6, "weight": 20},
  {"id": 7, "weight": 20},
  {"id": 8, "weight": 15},
  {"id": 9, "weight": 15},
  {"id": 10, "weight": 12},
  {"id": 1, "weight": 8},
  {"id": 2, "weight": 7},
  {"id": 3, "weight": 5}
]'::jsonb, 'active'),

-- Daily Free Box
('Daily Free Box', 'Free daily box! Common items guaranteed.', 0.00, 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400', 'free', 1,
'[
  {"id": 22, "weight": 50},
  {"id": 23, "weight": 45},
  {"id": 24, "weight": 40},
  {"id": 25, "weight": 35},
  {"id": 26, "weight": 30},
  {"id": 27, "weight": 25},
  {"id": 28, "weight": 20}
]'::jsonb, 'active');

-- ============================================================================
-- SAMPLE COUPON (Influencer Code)
-- ============================================================================
INSERT INTO coupons (code, influencer_name, influencer_url, lootbox_config, minimum_deposit_required, max_uses, status, created_by_admin_id) VALUES
('WELCOME2024', 'AQW Official', 'https://www.aq.com', 
'{"items": [
  {"id": 17, "weight": 30},
  {"id": 18, "weight": 25},
  {"id": 19, "weight": 20},
  {"id": 13, "weight": 15},
  {"id": 14, "weight": 10},
  {"id": 9, "weight": 5}
]}'::jsonb, 0.00, NULL, 'active', 1),

('STREAMER500', 'AQW Streamer', 'https://twitch.tv/aqwstreamer', 
'{"items": [
  {"id": 5, "weight": 30},
  {"id": 6, "weight": 25},
  {"id": 7, "weight": 20},
  {"id": 8, "weight": 15},
  {"id": 9, "weight": 10}
]}'::jsonb, 10.00, 1000, 'active', 1);

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
