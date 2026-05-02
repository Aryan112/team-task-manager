const express = require('express');
const { body } = require('express-validator');
const {
  createTask, getTasks, updateTask, deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('project_id').isInt().withMessage('Valid project_id required'),
  ],
  createTask
);
router.get('/', protect, getTasks);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;