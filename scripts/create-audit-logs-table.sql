-- Create audit_logs collection in Appwrite
-- This collection stores all audit trail data for compliance and security monitoring

-- Collection: audit_logs
-- Attributes to create in Appwrite Console:

-- clinic_id (string, required, size: 36) - Indexed
-- user_id (string, required, size: 36) - Indexed
-- user_email (string, required, size: 255)
-- user_role (string, required, size: 50)
-- action (string, required, size: 50) - Indexed
-- entity_type (string, required, size: 50) - Indexed
-- entity_id (string, required, size: 36) - Indexed
-- entity_description (string, optional, size: 500)
-- changes (string, optional, size: 10000) - JSON string
-- metadata (string, optional, size: 10000) - JSON string
-- ip_address (string, optional, size: 45)
-- user_agent (string, optional, size: 500)
-- timestamp (datetime, required) - Indexed
-- success (boolean, required)
-- error_message (string, optional, size: 1000)
-- risk_level (string, optional, size: 20) - Indexed

-- Indexes to create:
-- 1. clinic_id + timestamp (DESC) - For querying clinic audit logs
-- 2. entity_type + entity_id + timestamp (DESC) - For entity-specific audit trails
-- 3. user_id + timestamp (DESC) - For user activity logs
-- 4. risk_level + timestamp (DESC) - For security monitoring
-- 5. success + timestamp (DESC) - For failed operation monitoring

-- Permissions:
-- Read: Role: super_admin, Role: clinic_admin (with clinic_id filter)
-- Create: None (only via server-side functions)
-- Update: None (audit logs are immutable)
-- Delete: None (audit logs are immutable, use retention policies)

-- Document-level security:
-- All operations must go through server-side code
-- No direct database access from frontend

-- Retention Policy:
-- Audit logs should be retained according to clinic's data_retention_days setting
-- Implement automated archival/deletion via scheduled Appwrite Functions
