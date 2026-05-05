import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyTasks, updateTask } from '../../lib/api';
import { Link } from 'react-router';
import { CheckSquare, AlertCircle, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  formatDate, statusLabels, priorityLabels, priorityColors, isOverdue, isDueToday,
} from '../../lib/utils';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { TableRowSkeleton } from './ui/LoadingSkeleton';

export default function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at'>('due_date');
  const [search, setSearch] = useState('');

  const loadTasks = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await getMyTasks();
      setTasks(data ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleStatusChange(taskId: string, newStatus: string) {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await updateTask('', taskId, { status: newStatus });
      toast.success('Status updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task');
      loadTasks();
    }
  }

  // Filter + sort
  const filtered = tasks
    .filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.title?.toLowerCase().includes(q) && !t.project?.name?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sortBy === 'priority') {
        const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const overdueCount = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const dueTodayCount = tasks.filter((t) => isDueToday(t.due_date) && t.status !== 'done').length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">My Tasks</h1>
        <p className="text-slate-400">All tasks assigned to you across every project</p>

        {!loading && (overdueCount > 0 || dueTodayCount > 0) && (
          <div className="flex flex-wrap gap-3 mt-4">
            {overdueCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span className="text-sm text-rose-400 font-medium">
                  {overdueCount} overdue
                </span>
              </div>
            )}
            {dueTodayCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">
                  {dueTodayCount} due today
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="all">All Status</option>
          {Object.entries(statusLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="all">All Priorities</option>
          {Object.entries(priorityLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="due_date">Sort by Due Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="created_at">Sort by Created</option>
        </select>
      </div>

      {/* Tasks table */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                {['Task', 'Project', 'Priority', 'Status', 'Due Date'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckSquare className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              {search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'No tasks match your filters'
                : 'No tasks assigned to you'}
            </h3>
            <p className="text-slate-500 text-sm">
              {search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Tasks assigned to you will appear here'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                {['Task', 'Project', 'Priority', 'Status', 'Due Date'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filtered.map((task) => {
                const overdue = isOverdue(task.due_date, task.status);
                const dueToday = isDueToday(task.due_date) && task.status !== 'done';
                return (
                  <tr
                    key={task.id}
                    className={`transition-all ${overdue ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-slate-700/20'}`}
                  >
                    <td className="px-6 py-3.5">
                      <Link to={`/projects/${task.project_id}`} className="block group">
                        <div className="flex items-start gap-2">
                          {overdue && <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
                          <div>
                            <p className={`font-medium group-hover:underline decoration-dotted ${overdue ? 'text-rose-400' : 'text-white'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td className="px-6 py-3.5">
                      {task.project ? (
                        <Link
                          to={`/projects/${task.project_id}`}
                          className="flex items-center gap-1.5 group"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.project.color }}
                          />
                          <span className="text-sm text-slate-300 group-hover:text-indigo-400 transition-colors truncate max-w-32">
                            {task.project.name}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>

                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          priorityColors[task.priority as keyof typeof priorityColors] ?? 'bg-slate-500'
                        } text-white`}
                      >
                        {priorityLabels[task.priority as keyof typeof priorityLabels] ?? task.priority}
                      </span>
                    </td>

                    <td className="px-6 py-3.5">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {Object.entries(statusLabels).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-3.5">
                      {task.due_date ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm ${
                              overdue ? 'text-rose-400 font-medium' :
                              dueToday ? 'text-amber-400 font-medium' :
                              'text-slate-400'
                            }`}
                          >
                            {formatDate(task.due_date)}
                          </span>
                          {dueToday && !overdue && <Badge variant="warning">Today</Badge>}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600">No due date</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Row count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-500 mt-3 text-right">
          Showing {filtered.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
