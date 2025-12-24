const express = require('express');
const { pool } = require('../db/database');
const { logAudit } = require('../utils/auditLogger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// API 12: Create Project
router.post('/', async (req, res) => {
  const { name, description, status } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    // Check tenant subscription limit
    const tenantResult = await pool.query('SELECT max_projects FROM tenants WHERE id = $1', [tenantId]);
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const tenant = tenantResult.rows[0];

    const projectCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1',
      [tenantId]
    );
    const currentProjectCount = parseInt(projectCountResult.rows[0].count);

    if (currentProjectCount >= tenant.max_projects) {
      return res.status(403).json({ success: false, message: 'Subscription limit reached - max projects exceeded' });
    }

    const projectId = uuidv4();
    const projectStatus = status || 'active';

    await pool.query(
      'INSERT INTO projects (id, tenant_id, name, description, status, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
      [projectId, tenantId, name, description || null, projectStatus, userId]
    );

    // Log audit
    await logAudit(tenantId, userId, 'CREATE_PROJECT', 'project', projectId, req.ip);

    res.status(201).json({
      success: true,
      data: {
        id: projectId,
        tenantId,
        name,
        description,
        status: projectStatus,
        createdBy: userId,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API 13: List Projects
router.get('/', async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  try {
    const tenantId = req.user.tenantId;
    let query = `SELECT p.id, p.name, p.description, p.status, p.created_by as createdBy, 
                        u.full_name as creatorName, p.created_at as createdAt,
                        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as taskCount,
                        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completedTaskCount
                 FROM projects p
                 LEFT JOIN users u ON p.created_by = u.id
                 WHERE p.tenant_id = $1`;
    
    const params = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND p.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1${status ? ` AND status = $2` : ''}${search ? ` AND name ILIKE $${status ? 3 : 2}` : ''}`;
    const countParams = [tenantId];
    if (status) countParams.push(status);
    if (search) countParams.push(`%${search}%`);
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params
