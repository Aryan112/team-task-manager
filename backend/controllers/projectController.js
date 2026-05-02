// controllers/projectController.js
const pool = require('../config/db');
const { validationResult } = require('express-validator');

// POST /api/projects (admin only)
exports.createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description, memberIds = [] } = req.body;

    const [result] = await pool.query(
      `INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)`,
      [name, description || null, req.user.id]
    );
    const projectId = result.insertId;

    // Auto-add creator as a member
    await pool.query(
      `INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`,
      [projectId, req.user.id]
    );

    // Add other members
    for (const uid of memberIds) {
      await pool.query(
        `INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`,
        [projectId, uid]
      );
    }

    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      [rows] = await pool.query(
        `SELECT p.*, u.name AS creator_name
         FROM projects p
         JOIN users u ON p.created_by = u.id
         ORDER BY p.created_at DESC`
      );
    } else {
      [rows] = await pool.query(
        `SELECT p.*, u.name AS creator_name
         FROM projects p
         JOIN users u ON p.created_by = u.id
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = ?
         ORDER BY p.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [project] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (project.length === 0) return res.status(404).json({ message: 'Project not found' });

    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
      [id]
    );

    res.json({ ...project[0], members });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/members (admin only)
exports.addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    await pool.query(
      `INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`,
      [id, userId]
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id (admin only)
exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};