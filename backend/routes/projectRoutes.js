const express = require('express');
const { body } = require('express-validator');
const {
  createProject, getProjects, getProjectById, addMember, deleteProject,
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/',
  protect,
  adminOnly,
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  createProject
);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/:id/members', protect, adminOnly, addMember);
router.delete('/:id', protect, adminOnly, deleteProject);

module.exports = router;