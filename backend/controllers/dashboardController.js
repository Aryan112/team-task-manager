// controllers/dashboardController.js
const pool = require('../config/db');

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Status summary
    let statusQuery, statusParams;
    if (isAdmin) {
      statusQuery = `SELECT status, COUNT(*) AS count FROM tasks GROUP BY status`;
      statusParams = [];
    } else {
      statusQuery = `
        SELECT status, COUNT(*) AS count FROM tasks
        WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
        GROUP BY status`;
      statusParams = [userId];
    }
    const [statusSummary] = await pool.query(statusQuery, statusParams);

    // Overdue tasks
    let overdueQuery, overdueParams;
    if (isAdmin) {
      overdueQuery = `
        SELECT t.*, u.name AS assignee_name, p.name AS project_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.due_date < CURDATE() AND t.status != 'done'
        ORDER BY t.due_date ASC`;
      overdueParams = [];
    } else {
      overdueQuery = `
        SELECT t.*, u.name AS assignee_name, p.name AS project_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
          AND t.due_date < CURDATE() AND t.status != 'done'
        ORDER BY t.due_date ASC`;
      overdueParams = [userId];
    }
    const [overdueTasks] = await pool.query(overdueQuery, overdueParams);

    // My tasks (assigned to current user)
    const [myTasks] = await pool.query(
      `SELECT t.*, p.name AS project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = ?
       ORDER BY t.due_date ASC`,
      [userId]
    );

    // Total projects
    const [projectCount] = await pool.query(
      isAdmin
        ? 'SELECT COUNT(*) AS count FROM projects'
        : 'SELECT COUNT(*) AS count FROM project_members WHERE user_id = ?',
      isAdmin ? [] : [userId]
    );

    res.json({
      statusSummary,
      overdueTasks,
      myTasks,
      totalProjects: projectCount[0].count,
    });
  } catch (err) {
    next(err);
  }
};