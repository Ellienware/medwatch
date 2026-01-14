-- Additional billing tables for per-branch subscription model (MedSurv)

-- =====================================================
-- SUBSCRIPTION PLANS TABLE
-- =====================================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Pricing (in cents for precision)
  monthly_price_per_branch INTEGER NOT NULL, -- R6,500 = 650000 cents
  setup_fee_per_branch INTEGER NOT NULL, -- R8,500 = 850000 cents
  
  -- Features
  features JSONB DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plan
INSERT INTO subscription_plans (name, description, monthly_price_per_branch, setup_fee_per_branch, features) VALUES
('standard', 'Complete medical surveillance system', 650000, 850000, '["Unlimited patients", "Unlimited staff users", "All clinical tests", "Certificate generation", "Employer portal", "Advanced reporting", "24/7 support", "Custom branding", "Data migration", "Staff onboarding"]');

-- =====================================================
-- BRANCH SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE branch_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Subscription details
  status subscription_status DEFAULT 'trial',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Paystack details
  paystack_subscription_code VARCHAR(255),
  paystack_customer_code VARCHAR(255),
  
  -- Pricing snapshot (in case prices change)
  monthly_price INTEGER NOT NULL,
  setup_fee_paid BOOLEAN DEFAULT false,
  setup_fee_amount INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(branch_id)
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  branch_subscription_id UUID REFERENCES branch_subscriptions(id) ON DELETE SET NULL,
  
  -- Payment details
  payment_type VARCHAR(50) NOT NULL, -- 'subscription', 'setup_fee', 'invoice'
  amount INTEGER NOT NULL, -- In cents
  currency VARCHAR(10) DEFAULT 'ZAR',
  
  -- Paystack details
  paystack_reference VARCHAR(255) UNIQUE NOT NULL,
  paystack_transaction_id VARCHAR(255),
  paystack_authorization_code VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed, cancelled
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USAGE TRACKING TABLE
-- =====================================================
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metrics
  patients_registered INTEGER DEFAULT 0,
  appointments_created INTEGER DEFAULT 0,
  tests_performed INTEGER DEFAULT 0,
  certificates_issued INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(clinic_id, branch_id, period_start)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_branch_subscriptions_clinic ON branch_subscriptions(clinic_id);
CREATE INDEX idx_branch_subscriptions_branch ON branch_subscriptions(branch_id);
CREATE INDEX idx_branch_subscriptions_status ON branch_subscriptions(status);

CREATE INDEX idx_payments_clinic ON payments(clinic_id);
CREATE INDEX idx_payments_reference ON payments(paystack_reference);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_usage_tracking_clinic ON usage_tracking(clinic_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);
