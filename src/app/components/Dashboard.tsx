import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats, getMyTasks, getProjects } from '../../lib/api';
import { Link } from 'react-router';
import {
  TrendingUp, AlertCircle, CheckCircle2, FolderKanban,
  ArrowRight, Clock, BarChart3,
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate, statusLabels, priorityColors, priorityLabels, isOverdue } from '../../lib/utils';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { StatSkeleton, CardSkeleton } from './ui/LoadingSkeleton';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [statsRes, tasksRes, projectsRes] = await Promise.all([
        getDashboardStats(),
        getMyTasks(),
        getProjects(),
      ]);

      setStats(statsRes.data);
      setMyTasks((tasksRes.data ?? []).slice(0, 8));
      setRecentProjects(
        (projectsRes.data ?? [])
          .filter((p: any) => p.status === 'active')
          .slice(0, 4)
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statCards = [
    {
      label: 'Active Projects',
      value: stats?.totalProjects ?? 0,
      icon: FolderKanban,
      color: 'indigo',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
    },
    {
      label: 'Due Today',
      value: stats?.dueToday ?? 0,
      icon: Clock,
      color: 'amber',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
    },
    {
      label: 'Overdue Tasks',
      value: stats?.overdue ?? 0,
      icon: AlertCircle,
      color: 'rose',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
    },
    {
      label: 'Done This Week',
      value: stats?.completedThisWeek ?? 0,
      icon: CheckCircle2,
      color: 'emerald',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
    },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">
          {greeting()}, {displayName} 👋
        </h1>
        <p className="text-slate-400">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading
          ? [1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)
          : statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/60 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <div className={`p-2 ${stat.bg} rounded-lg`}>
                      <Icon className={`w-5 h-5 ${stat.text}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </motion.div>
              );
            })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">My Tasks</h2>
            <Link
              to="/my-tasks"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-700/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : myTasks.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-medium mb-1">All clear!</p>
                <p className="text-slate-500 text-sm">No tasks assigned to you yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/40">
                {myTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/projects/${task.project_id}`}
                    className="flex items-start justify-between gap-4 p-4 hover:bg-slate-700/30 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-medium truncate ${
                            isOverdue(task.due_date, task.status)
                              ? 'text-rose-400'
                              : 'text-white'
                          }`}
                        >
                          {task.title}
                        </h3>
                        {isOverdue(task.due_date, task.status) && (
                          <span className="flex items-center gap-0.5 text-xs text-rose-400 shrink-0">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                      </div>
                      {task.project && (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.project.color }}
                          />
                          <p className="text-xs text-slate-400 truncate">{task.project.name}</p>
                        </div>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-slate-500 mt-1">{formatDate(task.due_date)}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge
                        variant={
                          task.status === 'done' ? 'success' :
                          task.status === 'in_progress' ? 'info' :
                          task.status === 'in_review' ? 'warning' : 'default'
                        }
                      >
                        {statusLabels[task.status as keyof typeof statusLabels] ?? task.status}
                      </Badge>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors] ?? 'bg-slate-500'} text-white`}
                      >
                        {priorityLabels[task.priority as keyof typeof priorityLabels] ?? task.priority}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Projects</h2>
            <Link
              to="/projects"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : recentProjects.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-10 text-center">
                <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-medium mb-1">No projects yet</p>
                <Link
                  to="/projects"
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Create your first project →
                </Link>
              </div>
            ) : (
              recentProjects.map((project) => {
                const members = project.project_members ?? [];
                const taskCount = 0; // tasks count not fetched here for perf
                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:border-indigo-500/30 hover:bg-slate-800/70 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-slate-400 line-clamp-1 mt-0.5">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {members.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex -space-x-2">
                          {members.slice(0, 4).map((m: any) => (
                            <Avatar
                              key={m.id}
                              name={m.user?.full_name ?? '?'}
                              avatarUrl={m.user?.avatar_url}
                              size="sm"
                              className="border-2 border-slate-800"
                            />
                          ))}
                        </div>
                        {members.length > 4 && (
                          <span className="text-xs text-slate-400">
                            +{members.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {project.due_date && (
                      <p className="text-xs text-slate-500">Due {formatDate(project.due_date)}</p>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
