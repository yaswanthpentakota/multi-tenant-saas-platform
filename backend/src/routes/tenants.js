const express = require('express');
const { pool } = require('../db/database');
const { authorize } = require('../middleware/authorization');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// API 5: Get Tenant Details
router.get('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Check authorization
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    
    const tenant = result.rows[0];
    
    // Get stats
    const usersCount = await pool.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    const projectsCount = await pool.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
    const tasksCount = await pool.query('SELECT COUNT(*) FROM tasks WHERE tenant_id = $1', [tenantId]);
    
    res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        createdAt: tenant.created_at,
        stats: {
          totalUsers: parseInt(usersCount.rows[0].count),
          totalProjects: parseInt(projectsCount.rows[0].count),
          totalTasks:
