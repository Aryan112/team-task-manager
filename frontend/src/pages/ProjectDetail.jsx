import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const load = async () => {
    const [projRes, tasksRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project_id=${id}`),
    ]);
    setProject(projRes.data);
    setTasks(tasksRes.data);
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setModalOpen(true);
  };

  if (!project) return <div className="p-6">Loading...</div>;

  const columns = [
    { id: 'todo', label: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
    { id: 'done', label: 'Done', color: 'bg-green-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-gray-600 hover:text-blue-600 mb-4">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
            {project.description && <p className="text-gray-600 mt-1">{project.description}</p>}
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <Users size={16} />
              <span>{project.members?.length || 0} members</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {project.members?.map((m) => (
                <span key={m.id} className="badge bg-blue-50 text-blue-700">
                  {m.name} ({m.role})
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setEditTask(null); setModalOpen(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.id} className={`${col.color} rounded-xl p-4`}>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center justify-between">
              {col.label}
              <span className="badge bg-white text-gray-600">
                {tasks.filter((t) => t.status === col.id).length}
              </span>
            </h3>
            <div className="space-y-3">
              {tasks.filter((t) => t.status === col.id).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        onSuccess={load}
        task={editTask}
        projects={[project]}
      />
    </div>
  );
}