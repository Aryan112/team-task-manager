import { Calendar, User, AlertCircle, Trash2, Edit } from 'lucide-react';

const statusColors = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-800 flex-1">{task.title}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`badge ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        {task.project_name && (
          <span className="badge bg-purple-100 text-purple-700">
            {task.project_name}
          </span>
        )}
        {isOverdue && (
          <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
            <AlertCircle size={12} /> Overdue
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        {task.assignee_name && (
          <span className="flex items-center gap-1">
            <User size={12} /> {task.assignee_name}
          </span>
        )}
        {task.due_date && (
          <span className="flex items-center gap-1">
            <Calendar size={12} /> {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
        className={`w-full text-xs font-medium px-2 py-1.5 rounded border-0 cursor-pointer ${statusColors[task.status]}`}
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>
    </div>
  );
}