-- Row-Level Security (RLS) Policies for Multi-Tenancy
-- Ensures strict data isolation between clinics

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Get Current User's Clinic ID
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT clinic_id
    FROM users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Get Current User's Role
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role
    FROM users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Check if Super Admin
-- =====================================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin'
    FROM users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CLINICS RLS POLICIES
-- =====================================================

-- Super admins can see all clinics
CREATE POLICY "Super admins can view all clinics"
ON clinics FOR SELECT
USING (is_super_admin());

-- Super admins can create clinics
CREATE POLICY "Super admins can create clinics"
ON clinics FOR INSERT
WITH CHECK (is_super_admin());

-- Super admins can update clinics
CREATE POLICY "Super admins can update clinics"
ON clinics FOR UPDATE
USING (is_super_admin());

-- Clinic admins can view their own clinic
CREATE POLICY "Clinic admins can view own clinic"
ON clinics FOR SELECT
USING (id = get_current_user_clinic_id());

-- Clinic admins can update their own clinic
CREATE POLICY "Clinic admins can update own clinic"
ON clinics FOR UPDATE
USING (id = get_current_user_clinic_id() AND get_current_user_role() = 'clinic_admin');

-- =====================================================
-- BRANCHES RLS POLICIES
-- =====================================================

-- Users can only see branches from their clinic
CREATE POLICY "Users can view own clinic branches"
ON branches FOR SELECT
USING (clinic_id = get_current_user_clinic_id() OR is_super_admin());

-- Clinic admins can manage branches
CREATE POLICY "Clinic admins can insert branches"
ON branches FOR INSERT
WITH CHECK (clinic_id = get_current_user_clinic_id() AND get_current_user_role() = 'clinic_admin');

CREATE POLICY "Clinic admins can update branches"
ON branches FOR UPDATE
USING (clinic_id = get_current_user_clinic_id() AND get_current_user_role() = 'clinic_admin');

CREATE POLICY "Clinic admins can delete branches"
ON branches FOR DELETE
USING (clinic_id = get_current_user_clinic_id() AND get_current_user_role() = 'clinic_admin');

-- =====================================================
-- USERS RLS POLICIES
-- =====================================================

-- Users can view users from their clinic
CREATE POLICY "Users can view own clinic users"
ON users FOR SELECT
USING (clinic_id = get_current_user_clinic_id() OR is_super_admin());

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth_user_id = auth.uid());

-- Clinic admins can manage users
CREATE POLICY "Clinic admins can insert users"
ON users FOR INSERT
WITH CHECK (clinic_id = get_current_user_clinic_id() AND get_current_user_role() = 'clinic_admin');

CREATE POLICY "Clinic admins can update users"
ON users FOR UPDATE
USING (clinic_id = get_current_user_clinic_id() AND get_current_user_role() = 'clinic_admin');

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth_user_id = auth.uid());

-- =====================================================
-- EMPLOYERS RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own clinic employers"
ON employers FOR SELECT
USING (clinic_id = get_current_user_clinic_id() OR is_super_admin());

CREATE POLICY "Staff can manage employers"
ON employers FOR ALL
USING (
  clinic_id = get_current_user_clinic_id() AND 
  get_current_user_role() IN ('clinic_admin', 'receptionist')
);

-- =====================================================
-- PATIENTS RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own clinic patients"
ON patients FOR SELECT
USING (clinic_id = get_current_user_clinic_id() OR is_super_admin());

CREATE POLICY "Staff can manage patients"
ON patients FOR ALL
USING (
  clinic_id = get_current_user_clinic_id() AND 
  get_current_user_role() IN ('clinic_admin', 'receptionist', 'nurse', 'doctor')
);

-- =====================================================
-- APPOINTMENTS RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own clinic appointments"
ON appointments FOR SELECT
USING (clinic_id = get_current_user_clinic_id() OR is_super_admin());

CREATE POLICY "Staff can manage appointments"
ON appointments FOR ALL
USING (
  clinic_id = get_current_user_clinic_id() AND 
  get_current_user_role() IN ('clinic_admin', 'receptionist', 'nurse', 'doctor')
);

-- =====================================================
-- CLINICAL TESTS RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own clinic tests"
ON clinical_tests FOR SELECT
USING (clinic_id = get_current_user_clinic_id() OR is_super_admin());

CREATE POLICY "Clinic admins can manage tests"
ON clinical_tests FOR ALL
USING (clinic_id = get_current_user_clinic_id() AND get_current_user_role() = 'clinic_admin');

-- =====================================================
-- TEST RESULTS RLS POLICIES
-- =====================================================

CREATE POLICY "Medical staff can view test results"
ON test_results FOR SELECT
USING (
  clinic_id = get_current_user_clinic_id() AND 
  get_current_user_role() IN ('clinic_admin', 'nurse', 'doctor') OR is_super_admin()
);

CREATE POLICY "Medical staff can manage test results"
ON test_results FOR ALL
USING (
  clinic_id = get_current_user_clinic_id() AND 
  get_current_user_role() IN ('nurse', 'doctor')
);

-- =====================================================
-- CERTIFICATES RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own clinic certificates"
ON certificates FOR SELECT
USING (clinic_id = get_current_user_clinic_id() OR is_super_admin());

CREATE POLICY "Doctors can manage certificates"
ON certificates FOR ALL
USING (
  clinic_id = get_current_user_clinic_id() AND 
  get_current_user_role() = 'doctor'
);

-- =====================================================
-- INVOICES RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own clinic invoices"
ON invoices FOR SELECT
USING (clinic_id = get_current_user_clinic_id() OR is_super_admin());

CREATE POLICY "Admins can manage invoices"
ON invoices FOR ALL
USING (clinic_id = get_current_user_clinic_id() AND get_current_user_role() = 'clinic_admin');

-- =====================================================
-- NOTIFICATIONS RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (clinic_id = get_current_user_clinic_id() OR is_super_admin());

-- =====================================================
-- AUDIT LOGS RLS POLICIES
-- =====================================================

CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (
  (clinic_id = get_current_user_clinic_id() AND get_current_user_role() = 'clinic_admin') 
  OR is_super_admin()
);

CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true); -- Allow all inserts for audit purposes
