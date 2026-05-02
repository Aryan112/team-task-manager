// controllers/taskController.js
const pool = require('../config/db');
const { validationResult } = require('express-validator');

const isMember = async (projectId, userId) => {
  const [rows] = await pool.query(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  return rows.length > 0;
};

// POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, status, priority, due_date, project_id, assigned_to } = req.body;

    if (req.user.role !== 'admin' && !(await isMember(project_id, req.user.id))) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        status || 'todo',
        priority || 'medium',
        due_date || null,
        project_id,
        assigned_to || null,
        req.user.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks?project_id=...
exports.getTasks = async (req, res, next) => {
  try {
    const { project_id } = req.query;
    let query = `
      SELECT t.*, u.name AS assignee_name, p.name AS project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id
    `;
    const params = [];

    if (project_id) {
      query += ' WHERE t.project_id = ?';
      params.push(project_id);
    } else if (req.user.role !== 'admin') {
      query += `
        WHERE t.project_id IN (
          SELECT project_id FROM project_members WHERE user_id = ?
        )`;
      params.push(req.user.id);
    }

    query += ' ORDER BY t.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, assigned_to } = req.body;

    const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Task not found' });

    const task = existing[0];

    const canEdit =
      req.user.role === 'admin' ||
      task.created_by === req.user.id ||
      task.assigned_to === req.user.id;
    if (!canEdit) return res.status(403).json({ message: 'Not allowed' });

    await pool.query(
      `UPDATE tasks SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         status = COALESCE(?, status),
         priority = COALESCE(?, priority),
         due_date = COALESCE(?, due_date),
         assigned_to = COALESCE(?, assigned_to)
       WHERE id = ?`,
      [title, description, status, priority, due_date, assigned_to, id]
    );

    const [updated] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Task not found' });

    const task = existing[0];
    if (req.user.role !== 'admin' && task.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Only admin or creator can delete' });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};