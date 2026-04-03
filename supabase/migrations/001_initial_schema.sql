-- ============================================================
-- ZENTRA B2B MARKETPLACE — Schema completo
-- Ejecutar en Supabase SQL Editor o como migracion
-- ============================================================

-- ========================
-- ENUMS
-- ========================
CREATE TYPE business_type AS ENUM (
  'restaurante', 'pasteleria', 'hotel', 'catering',
  'panaderia', 'industria_alimentaria', 'supermercado', 'casino_institucional'
);

CREATE TYPE contact_preference AS ENUM ('email', 'whatsapp', 'llamada');

CREATE TYPE product_status AS ENUM ('active', 'low_stock', 'inactive');

CREATE TYPE quote_status AS ENUM ('open', 'in_progress', 'closed', 'cancelled');

CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TYPE plan_name AS ENUM ('starter', 'pro', 'enterprise');

CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due');

CREATE TYPE agent_type AS ENUM ('whatsapp_email', 'voice', 'email');

CREATE TYPE agent_status AS ENUM ('active', 'paused');

CREATE TYPE channel_type AS ENUM ('whatsapp', 'email', 'voice');

CREATE TYPE conversation_status AS ENUM ('active', 'completed');

CREATE TYPE message_role AS ENUM ('agent', 'user');

CREATE TYPE price_direction AS ENUM ('up', 'down');

-- ========================
-- USERS (tabla central)
-- ========================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  rut VARCHAR(20) UNIQUE NOT NULL,
  city VARCHAR(100),
  address TEXT,
  description TEXT,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  website VARCHAR(255),
  is_supplier BOOLEAN DEFAULT false,
  is_buyer BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- PERFILES ESPECÍFICOS POR ROL
-- ========================
CREATE TABLE buyer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_type business_type NOT NULL,
  monthly_volume VARCHAR(100),
  preferred_contact contact_preference DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE supplier_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  giro VARCHAR(255),
  response_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- CATEGORÍAS
-- ========================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  emoji VARCHAR(10)
);

-- Seed categorias
INSERT INTO categories (name, emoji) VALUES
  ('Congelados IQF', '🧊'),
  ('Lacteos', '🧀'),
  ('Carnes y cecinas', '🥩'),
  ('Harinas y cereales', '🌾'),
  ('Aceites y grasas', '🫒'),
  ('Abarrotes', '📦'),
  ('Frutas y verduras', '🥬'),
  ('Especias y condimentos', '🧂'),
  ('Frutos secos', '🥜'),
  ('Legumbres', '🫘'),
  ('Otros', '🍽️');

-- Relacion M:N usuario <-> categorias
CREATE TABLE user_categories (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, category_id)
);

-- ========================
-- PRODUCTOS
-- ========================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  price_unit VARCHAR(20) DEFAULT 'kg',
  stock DECIMAL(12,2) DEFAULT 0,
  stock_unit VARCHAR(20) DEFAULT 'kg',
  status product_status DEFAULT 'active',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- COTIZACIONES & OFERTAS
-- ========================
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'kg',
  delivery_date DATE,
  status quote_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quote_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price DECIMAL(12,2) NOT NULL,
  notes TEXT,
  status offer_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(quote_id, supplier_id) -- un proveedor solo oferta una vez por cotizacion
);

-- ========================
-- RESEÑAS
-- ========================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quote_offer_id UUID REFERENCES quote_offers(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- FAVORITOS
-- ========================
CREATE TABLE favorites (
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (buyer_id, supplier_id)
);

-- ========================
-- PLANES & SUSCRIPCIONES
-- ========================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name plan_name UNIQUE NOT NULL,
  price_clp INTEGER NOT NULL,
  max_contacts INTEGER, -- NULL = unlimited
  has_agents BOOLEAN DEFAULT false,
  has_voice_calls BOOLEAN DEFAULT false,
  has_crm BOOLEAN DEFAULT false,
  has_api BOOLEAN DEFAULT false
);

-- Seed planes
INSERT INTO plans (name, price_clp, max_contacts, has_agents, has_voice_calls, has_crm, has_api) VALUES
  ('starter',    150000, 50,   false, false, false, false),
  ('pro',        280000, 200,  true,  true,  false, false),
  ('enterprise', 400000, NULL, true,  true,  true,  true);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status subscription_status DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- ========================
-- ALERTAS DE PRECIO
-- ========================
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price DECIMAL(12,2) NOT NULL,
  new_price DECIMAL(12,2) NOT NULL,
  direction price_direction NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE price_alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  -- al menos uno debe ser NOT NULL
  CHECK (category_id IS NOT NULL OR product_id IS NOT NULL)
);

-- ========================
-- AGENTES IA & CONVERSACIONES
-- ========================
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type agent_type NOT NULL,
  status agent_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  contact_name VARCHAR(255),
  channel channel_type NOT NULL,
  status conversation_status DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- ÍNDICES
-- ========================
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_quote_requests_buyer ON quote_requests(buyer_id);
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_offers_quote ON quote_offers(quote_id);
CREATE INDEX idx_quote_offers_supplier ON quote_offers(supplier_id);
CREATE INDEX idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX idx_subscriptions_supplier ON subscriptions(supplier_id);
CREATE INDEX idx_ai_agents_supplier ON ai_agents(supplier_id);
CREATE INDEX idx_agent_conversations_agent ON agent_conversations(agent_id);
CREATE INDEX idx_agent_messages_conversation ON agent_messages(conversation_id);
CREATE INDEX idx_price_alerts_product ON price_alerts(product_id);
CREATE INDEX idx_price_alerts_created ON price_alerts(created_at DESC);

-- ========================
-- FUNCIONES HELPER
-- ========================

-- Rating promedio de un usuario
CREATE OR REPLACE FUNCTION get_user_rating(p_user_id UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
  FROM reviews
  WHERE reviewed_id = p_user_id;
$$ LANGUAGE sql STABLE;

-- Cantidad de ofertas por cotizacion
CREATE OR REPLACE FUNCTION get_offer_count(p_quote_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM quote_offers
  WHERE quote_id = p_quote_id;
$$ LANGUAGE sql STABLE;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================
-- ROW LEVEL SECURITY (RLS)
-- ========================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- Users: pueden ver todos, editar solo el suyo
CREATE POLICY "Users: ver todos" ON users
  FOR SELECT USING (true);
CREATE POLICY "Users: editar propio" ON users
  FOR UPDATE USING (auth_id = auth.uid());

-- Products: publicos para leer, solo el supplier puede modificar
CREATE POLICY "Products: ver todos" ON products
  FOR SELECT USING (true);
CREATE POLICY "Products: CRUD propio" ON products
  FOR ALL USING (supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Quote requests: compradores ven las suyas, proveedores ven las abiertas
CREATE POLICY "Quotes: buyer ve las suyas" ON quote_requests
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR status = 'open'
  );
CREATE POLICY "Quotes: buyer crea" ON quote_requests
  FOR INSERT WITH CHECK (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Quote offers: proveedor ve/crea las suyas, buyer ve ofertas de sus quotes
CREATE POLICY "Offers: ver relevantes" ON quote_offers
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR quote_id IN (SELECT id FROM quote_requests WHERE buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  );
CREATE POLICY "Offers: supplier crea" ON quote_offers
  FOR INSERT WITH CHECK (
    supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Reviews: publicas para leer
CREATE POLICY "Reviews: ver todas" ON reviews
  FOR SELECT USING (true);
CREATE POLICY "Reviews: crear propia" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Favorites: solo el buyer ve/maneja los suyos
CREATE POLICY "Favorites: propios" ON favorites
  FOR ALL USING (buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Subscriptions: solo el supplier ve la suya
CREATE POLICY "Subscriptions: propias" ON subscriptions
  FOR SELECT USING (supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- AI Agents: solo el supplier ve/maneja los suyos
CREATE POLICY "Agents: propios" ON ai_agents
  FOR ALL USING (supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Agent convos: propias" ON agent_conversations
  FOR ALL USING (agent_id IN (SELECT id FROM ai_agents WHERE supplier_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));

CREATE POLICY "Agent msgs: propios" ON agent_messages
  FOR ALL USING (conversation_id IN (
    SELECT ac.id FROM agent_conversations ac
    JOIN ai_agents a ON a.id = ac.agent_id
    JOIN users u ON u.id = a.supplier_id
    WHERE u.auth_id = auth.uid()
  ));

-- Profiles: ver todos, editar solo el propio
CREATE POLICY "Buyer profile: ver todos" ON buyer_profiles
  FOR SELECT USING (true);
CREATE POLICY "Buyer profile: editar propio" ON buyer_profiles
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Supplier profile: ver todos" ON supplier_profiles
  FOR SELECT USING (true);
CREATE POLICY "Supplier profile: editar propio" ON supplier_profiles
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
