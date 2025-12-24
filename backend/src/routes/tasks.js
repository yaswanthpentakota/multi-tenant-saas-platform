const express = require('express');
const { pool } = require('../db/database');
const { logAudit } = require('../utils/auditLogger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// API 16: Create Task
router.post('/projects/:projectId/tasks', async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assignedTo, priority, dueDate } = req.body;

  try {
    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const userId = req.user.userId;

    // Check project exists and belongs to user's tenant
    const projectResult = await pool.query(
      'SELECT tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const tenantId = projectResult.rows[0].tenant_id;

    // Check authorization
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // If assignedTo provided, verify user belongs to same tenant
    if (assignedTo) {
      const assignedUserResult = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, tenantId]
      );
      if (assignedUserResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Assigned user not found in this tenant' });
      }
    }

    const taskId = uuidv4();
    const taskPriority = priority || 'medium';

    await pool.query(
      'INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())',
      [taskId, projectId, tenantId, title, description || null, 'todo', taskPriority, assignedTo || null, dueDate || null]
    );

    // Log audit
    await logAudit(tenantId, userId, 'CREATE_TASK', 'task', taskId, req.ip);

    res.status(201).json({
      success: true,
      data: {
        id: taskId,
        projectId,
        tenantId,
        title,
        description,
        status: 'todo',
        priority: taskPriority,
        assignedTo,
        dueDate,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API 17: List Project Tasks
router.get('/projects/:projectId/tasks', async (req, res) => {
  const { projectId } = req.params;
  const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;

  try {
    const userId = req.user.userId;

    // Check project exists and authorization
    const projectResult = await pool.query(
      'SELECT tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const tenantId = projectResult.rows[0].tenant_id;

    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let query = `SELECT t.id, t.title, t.description, t.status, t.priority, t.assigned_to as assignedToId,
                        u.id as assignedToUserId, u.full_name as assignedToFullName, u.email as assignedToEmail,
                        t.due_date as dueDate, t.created_at as createdAt
                 FROM tasks t
                 LEFT JOIN users u ON t.assigned_to = u.id
                 WHERE t.project_id = $1`;

    const params = [projectId];
    let paramIndex = 2;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (assignedTo) {
      query += ` AND t.assigned_to = $${paramIndex}`;
      params.push(assignedTo);
      paramIndex++;
    }

    if (priority) {
      query += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (search) {
      query += ` AND t.title ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM tasks WHERE project_id = $1${status ? ` AND status = $2` : ''}`;
    const countParams = [projectId];
    if (status) countParams.push(status);
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY t.priority DESC, t.due_date ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    const tasks = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      assignedTo: row.assignedtouserid ? {
        id: row.assignedtouserid,
        fullName: row.assignedtofullname,
        email: row.assignedtoemail
      } : null,
      dueDate: row.duedate,
      createdAt: row.createdat
    }));

    res.json({
      success: true,
      data: {
        tasks,
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

// API 18: Update Task Status
router.patch('/:taskId/status', async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  try {
    if (!status || !['todo', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Get task
    const taskResult = await pool.query(
      'SELECT tenant_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const tenantId = taskResult.rows[0].tenant_id;

    // Check authorization
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update status
    await pool.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, taskId]
    );

    // Log audit
    await logAudit(tenantId, req.user.userId, 'UPDATE_TASK_STATUS', 'task', taskId, req.ip);

    res.json({
      success: true,
      data: {
        id: taskId,
        status,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API 19: Update Task (all fields)
router.put('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, priority, assignedTo, dueDate } = req.body;

  try {
    // Get task
    const taskResult = await pool.query(
      'SELECT tenant_id, project_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const tenantId = taskResult.rows[0].tenant_id;

    // Check authorization
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // If assignedTo provided, verify user belongs to same tenant
    if (assignedTo) {
      const assignedUserResult = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, tenantId]
      );
      if (assignedUserResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Assigned user not found in this tenant' });
      }
    }

    let updateQuery = 'UPDATE tasks SET updated_at = NOW()';
    const params = [taskId];

    if (title !== undefined) {
      updateQuery += ', title = $2';
      params.splice(1, 0, title);
    }

    if (description !== undefined) {
      updateQuery += `, description = $${params.length + 1}`;
      params.push(description);
    }

    if (status !== undefined) {
      updateQuery += `, status = $${params.length + 1}`;
      params.push(status);
    }

    if (priority !== undefined) {
      updateQuery += `, priority = $${params.length + 1}`;
      params.push(priority);
    }

    if (assignedTo !== undefined) {
      updateQuery += `, assigned_to = $${params.length + 1}`;
      params.push(assignedTo || null);
    }

    if (dueDate !== undefined) {
      updateQuery += `, due_date = $${params.length + 1}`;
      params.push(dueDate || null);
    }

    updateQuery += ' WHERE id = $1';

    await pool.query(updateQuery, params);

    // Log audit
    await logAudit(tenantId, req.user.userId, 'UPDATE_TASK', 'task', taskId, req.ip);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        id: taskId,
        title,
        description,
        status,
        priority,
        assignedTo,
        dueDate,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
