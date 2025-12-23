# Complete Backend Implementation

## Copy ALL of these files to your backend/src/ directory

## File: backend/src/routes/tenants.js

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authorizeRole } = require('../middleware/auth');

// GET /api/tenants/:tenantId
router.get('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { userId, role } = req.user;
    
    // Verify access
    if (role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const result = await db.query(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    
    const tenant = result.rows[0];
    
    // Get stats
    const usersCount = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    const projectsCount = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
    const tasksCount = await db.query('SELECT COUNT(*) FROM tasks WHERE tenant_id = $1', [tenantId]);
    
    res.json({
      success: true,
      data: {
        ...tenant,
        stats: {
          totalUsers: parseInt(usersCount.rows[0].count),
          totalProjects: parseInt(projectsCount.rows[0].count),
          totalTasks: parseInt(tasksCount.rows[0].count)
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tenants/:tenantId
router.put('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { role, userId } = req.user;
    const { name, status, subscription_plan, max_users, max_projects } = req.body;
    
    if (role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    // Tenant admin can only update name
    if (role !== 'super_admin' && (status || subscription_plan || max_users || max_projects)) {
      return res.status(403).json({ success: false, message: 'Only super admin can update these fields' });
    }
    
    let updateQuery = 'UPDATE tenants SET ';
    let params = [];
    let paramIndex = 1;
    
    if (name) {
      updateQuery += `name = $${paramIndex}, `;
      params.push(name);
      paramIndex++;
    }
    if (status) {
      updateQuery += `status = $${paramIndex}, `;
      params.push(status);
      paramIndex++;
    }
    if (subscription_plan) {
      updateQuery += `subscription_plan = $${paramIndex}, `;
      params.push(subscription_plan);
      paramIndex++;
    }
    if (max_users) {
      updateQuery += `max_users = $${paramIndex}, `;
      params.push(max_users);
      paramIndex++;
    }
    if (max_projects) {
      updateQuery += `max_projects = $${paramIndex}, `;
      params.push(max_projects);
      paramIndex++;
    }
    
    updateQuery += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    params.push(tenantId);
    
    const result = await db.query(updateQuery, params);
    
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    
    // Log audit
    await db.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [tenantId, userId, 'UPDATE_TENANT', 'tenant', tenantId]
    );
    
    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tenants (super admin only)
router.get('/', async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admin can list all tenants' });
    }
    
    const { page = 1, limit = 10, status, subscription_plan } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM tenants WHERE 1=1';
    let params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (subscription_plan) {
      query += ` AND subscription_plan = $${paramIndex}`;
      params.push(subscription_plan);
      paramIndex++;
    }
    
    // Get total count
    const countResult = await db.query(
      query.replace('SELECT *', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: {
        tenants: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTenants: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

## File: backend/src/routes/users.js

Coming next... (file too long)
