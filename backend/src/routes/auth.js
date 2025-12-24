const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db/database');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// API 1: Register Tenant
router.post('/register-tenant', async (req, res) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Validate inputs
    if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    if (adminPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    
    // Check subdomain uniqueness
    const subdomainExists = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
    if (subdomainExists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Subdomain already exists' });
    }
    
    // Create tenant
    const tenantId = uuidv4();
    await client.query(
      'INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
      [tenantId, tenantName, subdomain, 'active', 'free', 5, 3]
    );
    
    // Hash password and create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const userId = uuidv4();
    await client.query(
      'INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
      [userId, tenantId, adminEmail, hashedPassword, adminFullName, 'tenant_admin', true]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: { tenantId, subdomain, adminUser: { id: userId, email: adminEmail, fullName: adminFullName, role: 'tenant_admin' } }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// API 2: Login
router.post('/login', async (req, res) => {
  const { email, password, tenantSubdomain, tenantId } = req.body;
  
  try {
    // Find tenant
    let tenant;
    if (tenantSubdomain) {
      const result = await pool.query('SELECT * FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
      tenant = result.rows[0];
    } else if (tenantId) {
      const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      tenant = result.rows[0];
    }
    
    if (!tenant || tenant.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tenant not found or inactive' });
    }
    
    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenant.id]
    );
    const user = userResult.rows[0];
    
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(user.id, tenant.id, user.role);
    
    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, tenantId: tenant.id },
        token,
        expiresIn: 86400
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API 3: Get Current User
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const tenantResult = await pool.query('SELECT * FROM tenants WHERE id = $1', [req.user.tenantId]);
    const tenant = tenantResult.rows[0];
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        tenant: tenant ? { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain, subscriptionPlan: tenant.subscription_plan, maxUsers: tenant.max_users, maxProjects: tenant.max_projects } : null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API 4: Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await logAudit(req.user.tenantId, req.user.userId, 'LOGOUT', 'user', req.user.userId, req.ip);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
