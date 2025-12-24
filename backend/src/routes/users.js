const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db/database');
const { authorize } = require('../middleware/authorization');
const { logAudit } = require('../utils/auditLogger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// API 8: Add User to Tenant
router.post('/tenants/:tenantId/users', authorize(['tenant_admin']), async (req, res) => {
  const { tenantId } = req.params;
  const { email, password, fullName, role } = req.body;

  try {
    // Check authorization - must be admin of that tenant
    if (req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Validate inputs
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Check tenant exists
    const tenantResult = await pool.query('SELECT max_users FROM tenants WHERE id = $1', [tenantId]);
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const tenant = tenantResult.rows[0];

    // Check subscription limit
    const userCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    const currentUserCount = parseInt(userCountResult.rows[0].count);

    if (currentUserCount >= tenant.max_users) {
      return res.status(403).json({ success: false, message: 'Subscription limit reached - max users exceeded' });
    }

    // Check email uniqueness per tenant
    const emailExists = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );

    if (emailExists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const userRole = role === 'tenant_admin' ? 'tenant_admin' : 'user';

    // Create user
    await pool.query(
      'INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
      [userId, tenantId, email, hashedPassword, fullName, userRole, true]
    );

    // Log audit
    await logAudit(tenantId, req.user.userId, 'CREATE_USER', 'user', userId, req.ip);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: userId,
        email,
        fullName,
        role: userRole,
        tenantId,
        isActive: true,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API 9: List Tenant Users
router.get('/tenants/:tenantId/users', async (req, res) => {
  const { tenantId } = req.params;
  const { search, role, page = 1, limit = 50 } = req.query;

  try {
    // Check authorization
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let query = 'SELECT id, email, full_name as fullName, role, is_active as isActive, created_at as createdAt FROM users WHERE tenant_id = $1';
    const params = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM users WHERE tenant_id = $1${search ? ` AND (full_name ILIKE $2 OR email ILIKE $2)` : ''}${role ? ` AND role = ${role === 'tenant_admin' ? '$3' : '$2'}` : ''}`;
    const countResult = await pool.query(countQuery, params.slice(0, paramIndex - 1));
    const totalCount = parseInt(countResult.rows[0].count);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        users: result.rows,
        total: totalCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API 10: Update User
router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { fullName, role, isActive } = req.body;

  try {
    // Get user first
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];
    const tenantId = user.tenant_id;

    // Check authorization - must be admin of that tenant or the user themselves
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Users can only update their own fullName
    if (req.user.userId === userId) {
      if (fullName) {
        await pool.query(
          'UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2',
          [fullName, userId]
        );
      }
      res.json({
        success: true,
        message: 'User updated successfully',
        data: { id: userId, fullName, updated_at: new Date() }
      });
    } else {
      // Only tenant_admin can update role and isActive
      if (req.user.role !== 'tenant_admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      let updateQuery = 'UPDATE users SET updated_at = NOW()';
      const params = [userId];
      let paramIndex = 2;

      if (fullName) {
        updateQuery += `, full_name = $${paramIndex}`;
        params.splice(1, 0, fullName);
        paramIndex++;
      }

      if (role) {
        updateQuery += `, role = $${paramIndex}`;
        params.splice(1, 0, role);
        paramIndex++;
      }

      if (isActive !== undefined) {
        updateQuery += `, is_active = $${paramIndex}`;
        params.splice(1, 0, isActive);
        paramIndex++;
      }

      updateQuery += ` WHERE id = $1`;

      await pool.query(updateQuery, params);

      // Log audit
      await logAudit(tenantId, req.user.userId, 'UPDATE_USER', 'user', userId, req.ip);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { id: userId, fullName, role, isActive, updatedAt: new Date() }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API 11: Delete User
router.delete('/:userId', authorize(['tenant_admin']), async (req, res) => {
  const { userId } = req.params;

  try {
    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];
    const tenantId = user.tenant_id;

    // Check authorization
    if (req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Cannot delete self
    if (req.user.userId === userId) {
      return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
    }

    // Set assigned_to to NULL for tasks assigned to this user
    await pool.query(
      'UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1',
      [userId]
    );

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    // Log audit
    await logAudit(tenantId, req.user.userId, 'DELETE_USER', 'user', userId, req.ip);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
