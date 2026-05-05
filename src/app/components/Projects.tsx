import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getProjects, createProject, deleteProject, updateProject } from '../../lib/api';
import { Link } from 'react-router';
import {
  Plus, Search, Grid3x3, List, MoreVertical,
  Archive, Trash2, FolderKanban, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { formatDate, projectStatusLabels } from '../../lib/utils';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { CardSkeleton } from './ui/LoadingSkeleton';

export default function Projects() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await getProjects();
      setProjects(data ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Filter + search
  useEffect(() => {
    let filtered = projects;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    setFilteredProjects(filtered);
  }, [projects, searchQuery, statusFilter]);

  // Close menu on outside click
  useEffect(() => {
    const handler = () => setActiveMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  async function handleCreateProject(data: any) {
    try {
      await createProject('', data);
      toast.success('Project created!');
      loadProjects();
      setShowCreateModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project');
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await deleteProject('', id);
      toast.success('Project deleted');
      loadProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project');
    }
  }

  async function handleArchiveProject(id: string) {
    try {
      await updateProject('', id, { status: 'archived' });
      toast.success('Project archived');
      loadProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive project');
    }
  }

  function isUserAdmin(project: any) {
    const userId = profile?.id ?? user?.id;
    const member = project.project_members?.find((m: any) => m.user?.id === userId);
    return member?.role === 'admin';
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Projects</h1>
          <p className="text-slate-400">Manage and organize your team projects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all font-medium shrink-0"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="completed">Completed</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-16 text-center">
          <FolderKanban className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-slate-400 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first project to get started'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProjects.map((project) => {
              const members = project.project_members ?? [];
              const admin = isUserAdmin(project);
              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/60 transition-all relative group"
                >
                  {/* Admin menu */}
                  {admin && (
                    <div className="absolute top-4 right-4 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setActiveMenu(activeMenu === project.id ? null : project.id);
                        }}
                        className="p-1.5 hover:bg-slate-700/60 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>

                      {activeMenu === project.id && (
                        <div
                          className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => { setActiveMenu(null); handleArchiveProject(project.id); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-all"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                          <button
                            onClick={() => { setActiveMenu(null); handleDeleteProject(project.id); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-slate-700 transition-all rounded-b-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <Link to={`/projects/${project.id}`} className="block">
                    <div className="flex items-start gap-3 mb-4 pr-8">
                      <span
                        className="w-4 h-4 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-0.5 truncate">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-slate-400 line-clamp-2">{project.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                        {projectStatusLabels[project.status as keyof typeof projectStatusLabels] ?? project.status}
                      </Badge>
                    </div>

                    {members.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
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
                          <span className="text-xs text-slate-400">+{members.length - 4}</span>
                        )}
                      </div>
                    )}

                    {project.due_date && (
                      <p className="text-xs text-slate-500">Due {formatDate(project.due_date)}</p>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Project</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Members</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Due Date</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filteredProjects.map((project) => {
                const members = project.project_members ?? [];
                const admin = isUserAdmin(project);
                return (
                  <tr key={project.id} className="hover:bg-slate-700/20 transition-all">
                    <td className="px-6 py-4">
                      <Link to={`/projects/${project.id}`} className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                        <div>
                          <p className="font-medium text-white">{project.name}</p>
                          {project.description && (
                            <p className="text-sm text-slate-400 line-clamp-1">{project.description}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                        {projectStatusLabels[project.status as keyof typeof projectStatusLabels] ?? project.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {members.slice(0, 3).map((m: any) => (
                          <Avatar
                            key={m.id}
                            name={m.user?.full_name ?? '?'}
                            avatarUrl={m.user?.avatar_url}
                            size="sm"
                            className="border-2 border-slate-800"
                          />
                        ))}
                        {members.length > 3 && (
                          <span className="text-xs text-slate-400 ml-2 self-center">+{members.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {project.due_date ? formatDate(project.due_date) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {admin && (
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(activeMenu === project.id ? null : project.id);
                            }}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                          {activeMenu === project.id && (
                            <div
                              className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => { setActiveMenu(null); handleArchiveProject(project.id); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                              >
                                <Archive className="w-4 h-4" />Archive
                              </button>
                              <button
                                onClick={() => { setActiveMenu(null); handleDeleteProject(project.id); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-slate-700"
                              >
                                <Trash2 className="w-4 h-4" />Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <ProjectModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateProject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Project Modal ──────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
];

function ProjectModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (d: any) => Promise<void> }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    due_date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 3)
      e.name = 'Name must be at least 3 characters';
    if (formData.name.length > 50)
      e.name = 'Name must be less than 50 characters';
    if (formData.due_date) {
      const due = new Date(formData.due_date);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (due < today) e.due_date = 'Due date cannot be in the past';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ ...formData, name: formData.name.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">New Project</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg transition-all">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2.5 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.name ? 'border-rose-500' : 'border-slate-600'}`}
              placeholder="My Awesome Project"
              autoFocus
            />
            {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="What's this project about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: formData.color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className={`w-full px-4 py-2.5 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.due_date ? 'border-rose-500' : 'border-slate-600'}`}
            />
            {errors.due_date && <p className="mt-1 text-xs text-rose-400">{errors.due_date}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
