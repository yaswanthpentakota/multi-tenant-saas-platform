-- Insert Super Admin User (tenant_id = NULL)
INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
  NULL,
  'superadmin@system.com',
  '$2b$10$KIXxPfxr.sxQVk.KwKkSWOj.EHwYOfvCaIJVfPHcVJeI5bxnhYfOS', -- Admin@123 (hashed)
  'System Administrator',
  'super_admin',
  true
);

-- Insert Demo Tenant
INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES ('Demo Company', 'demo', 'active', 'pro', 25, 15)
RETURNING id AS demo_tenant_id;

-- Get the tenant ID for use in next inserts
DO $$
DECLARE
  demo_tenant_id UUID;
BEGIN
  SELECT id INTO demo_tenant_id FROM tenants WHERE subdomain = 'demo';
  
  -- Insert Demo Company Admin
  INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
  VALUES (
    demo_tenant_id,
    'admin@demo.com',
    '$2b$10$KIXxPfxr.sxQVk.KwKkSWOj.EHwYOfvCaIJVfPHcVJeI5bxnhYfOS', -- Demo@123 (hashed)
    'Demo Admin',
    'tenant_admin',
    true
  );
  
  -- Insert Demo Regular Users
  INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
  VALUES 
    (demo_tenant_id, 'user1@demo.com', '$2b$10$KIXxPfxr.sxQVk.KwKkSWOj.EHwYOfvCaIJVfPHcVJeI5bxnhYfOS', 'User One', 'user', true),
    (demo_tenant_id, 'user2@demo.com', '$2b$10$KIXxPfxr.sxQVk.KwKkSWOj.EHwYOfvCaIJVfPHcVJeI5bxnhYfOS', 'User Two', 'user', true);
  
  -- Insert Demo Projects
  INSERT INTO projects (tenant_id, name, description, status, created_by)
  SELECT 
    demo_tenant_id,
    'Project Alpha',
    'First demo project',
    'active',
    id
  FROM users WHERE email = 'admin@demo.com' AND tenant_id = demo_tenant_id;
  
  INSERT INTO projects (tenant_id, name, description, status, created_by)
  SELECT
    demo_tenant_id,
    'Project Beta',
    'Second demo project',
    'active',
    id
  FROM users WHERE email = 'admin@demo.com' AND tenant_id = demo_tenant_id;
END $$;
