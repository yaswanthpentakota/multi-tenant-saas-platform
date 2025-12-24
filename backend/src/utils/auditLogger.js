const { pool } = require('../db/database');

async function logAudit(tenantId, userId, action, entityType, entityId, ipAddress) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [tenantId, userId, action, entityType, entityId, ipAddress]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

module.exports = { logAudit };
