import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, ListTodo, FolderKanban, AlertCircle, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getCount = (status) => {
    const item = data.statusSummary.find((s) => s.status === status);
    return item ? Number(item.count) : 0;
  };

  const stats = [
    { label: 'Total Projects', value: data.totalProjects, icon: FolderKanban, color: 'bg-purple-500' },
    { label: 'To Do', value: getCount('todo'), icon: ListTodo, color: 'bg-gray-500' },
    { label: 'In Progress', value: getCount('in_progress'), icon: Clock, color: 'bg-blue-500' },
    { label: 'Done', value: getCount('done'), icon: CheckCircle2, color: 'bg-green-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user.name}! 👋</h1>
        <p className="text-gray-500 mt-1">Here's an overview of your team's work.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`${color} p-3 rounded-lg`}>
              <Icon className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue tasks */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-red-500" size={20} />
            <h2 className="text-lg font-bold">Overdue Tasks</h2>
            <span className="badge bg-red-100 text-red-700">{data.overdueTasks.length}</span>
          </div>
          {data.overdueTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">🎉 No overdue tasks!</p>
          ) : (
            <div className="space-y-2">
              {data.overdueTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="p-3 border border-red-100 bg-red-50 rounded-lg">
                  <p className="font-medium text-gray-800">{t.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                    <span>{t.project_name}</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(t.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My tasks */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="text-blue-500" size={20} />
            <h2 className="text-lg font-bold">My Tasks</h2>
            <span className="badge bg-blue-100 text-blue-700">{data.myTasks.length}</span>
          </div>
          {data.myTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks assigned to you.</p>
          ) : (
            <div className="space-y-2">
              {data.myTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">{t.title}</p>
                    <span className={`badge ${
                      t.status === 'done' ? 'bg-green-100 text-green-700' :
                      t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t.project_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}