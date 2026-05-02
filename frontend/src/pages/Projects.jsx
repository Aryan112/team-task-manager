import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProjectModal from '../components/ProjectModal';
import { Plus, FolderKanban, Trash2, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/projects')
      .then(({ data }) => setProjects(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? All tasks will be deleted too.')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
          <p className="text-gray-500 mt-1">Manage your team's projects</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-gray-700">No projects yet</h3>
          <p className="text-gray-500 mt-1">
            {user.role === 'admin' ? 'Create your first project to get started!' : 'Ask an admin to add you to a project.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="card hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderKanban className="text-blue-600" size={20} />
                </div>
                {user.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <Link to={`/projects/${p.id}`}>
                <h3 className="font-bold text-lg text-gray-800 hover:text-blue-600">{p.name}</h3>
              </Link>
              {p.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>
              )}

              <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User size={12} /> {p.creator_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}