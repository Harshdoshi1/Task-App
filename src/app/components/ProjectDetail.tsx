import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import {
  getProject, getProjectTasks, createTask, updateTask,
  deleteTask, addProjectMember, updateMemberRole, removeMember,
  updateProject, deleteProject, getProfileByEmail,
} from '../../lib/api';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay,
  DragStartEvent, PointerSensor, useSensor, useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft, Plus, Trash2, AlertCircle, Calendar,
  User, Users, Settings, LayoutList, Kanban, X, Loader2,
  GripVertical, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  formatDate, statusLabels, priorityLabels, priorityColors, isOverdue,
} from '../../lib/utils';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: 'bg-slate-500' },
  { id: 'in_progress', label: 'In Progress',  color: 'bg-blue-500' },
  { id: 'in_review',   label: 'In Review',    color: 'bg-violet-500' },
  { id: 'done',        label: 'Done',         color: 'bg-emerald-500' },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'board' | 'list' | 'members' | 'settings'>('board');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<string>('todo');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadProject = useCallback(async () => {
    if (!user || !id) return;
    try {
      const { data } = await getProject('', id);
      setProject(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  const loadTasks = useCallback(async () => {
    if (!user || !id) return;
    try {
      setTasksLoading(true);
      const { data } = await getProjectTasks('', id);
      setTasks(data ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tasks');
    } finally {
      setTasksLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    loadProject();
    loadTasks();
  }, [loadProject, loadTasks]);

  function isUserAdmin() {
    const userId = profile?.id ?? user?.id;
    return project?.project_members?.some(
      (m: any) => m.user?.id === userId && m.role === 'admin'
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCardId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus || !COLUMNS.find((c) => c.id === newStatus)) return;

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    try {
      await updateTask('', taskId, { status: newStatus });
      toast.success('Task moved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task');
      loadTasks();
    }
  }

  const activeCard = tasks.find((t) => t.id === activeCardId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading project…</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-slate-400 text-lg">Project not found or you don't have access.</p>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'board', label: 'Board', icon: Kanban },
    { id: 'list', label: 'List', icon: LayoutList },
    { id: 'members', label: 'Members', icon: Users },
    ...(isUserAdmin() ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
  ] as { id: 'board' | 'list' | 'members' | 'settings'; label: string; icon: any }[];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 lg:px-8 pt-6 pb-0 border-b border-slate-700/50 flex-shrink-0">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <span
              className="w-4 h-4 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="text-slate-400 mt-1 text-sm">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {project.due_date && (
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <Calendar className="w-4 h-4" />
                {formatDate(project.due_date)}
              </div>
            )}
            <button
              onClick={() => { setDefaultStatus('todo'); setSelectedTask(null); setShowTaskModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-800/80 text-white border-b-2 border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'board' && (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 min-h-[60vh]">
                {COLUMNS.map((col) => {
                  const colTasks = tasks.filter((t) => t.status === col.id);
                  return (
                    <KanbanColumn
                      key={col.id}
                      column={col}
                      tasks={colTasks}
                      loading={tasksLoading}
                      onTaskClick={(task) => { setSelectedTask(task); setShowTaskModal(true); }}
                      onAddTask={() => {
                        setDefaultStatus(col.id);
                        setSelectedTask(null);
                        setShowTaskModal(true);
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <DragOverlay>
              {activeCard && (
                <div className="rotate-2 shadow-2xl opacity-90">
                  <TaskCardUI task={activeCard} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {activeTab === 'list' && (
          <ListView
            tasks={tasks}
            loading={tasksLoading}
            onTaskClick={(task) => { setSelectedTask(task); setShowTaskModal(true); }}
            onStatusChange={async (taskId: string, status: string) => {
              setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
              try {
                await updateTask('', taskId, { status });
              } catch (err: any) {
                toast.error(err.message);
                loadTasks();
              }
            }}
          />
        )}

        {activeTab === 'members' && (
          <MembersView
            project={project}
            isAdmin={isUserAdmin()}
            onUpdate={loadProject}
          />
        )}

        {activeTab === 'settings' && isUserAdmin() && (
          <SettingsView
            project={project}
            onUpdate={loadProject}
            onDelete={() => navigate('/projects')}
          />
        )}
      </div>

      {/* Task Slide-over */}
      {showTaskModal && (
        <TaskSlideOver
          task={selectedTask}
          defaultStatus={defaultStatus}
          projectId={id!}
          project={project}
          isAdmin={isUserAdmin()}
          onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
          onSave={() => { loadTasks(); setShowTaskModal(false); setSelectedTask(null); }}
          onDelete={async (taskId: string) => {
            try {
              await deleteTask('', taskId);
              toast.success('Task deleted');
              loadTasks();
              setShowTaskModal(false);
              setSelectedTask(null);
            } catch (err: any) {
              toast.error(err.message || 'Failed to delete task');
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ column, tasks, loading, onTaskClick, onAddTask }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
        <h3 className="font-semibold text-white text-sm">{column.label}</h3>
        <span className="ml-auto text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 rounded-xl p-3 space-y-2.5 min-h-[400px] transition-colors ${
            isOver ? 'bg-indigo-500/10 ring-2 ring-indigo-500/30' : 'bg-slate-800/30'
          }`}
        >
          {loading ? (
            [1, 2].map((i) => (
              <div key={i} className="h-24 bg-slate-700/40 rounded-lg animate-pulse" />
            ))
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-600 text-sm">
              <p>No tasks</p>
            </div>
          ) : (
            tasks.map((task: any) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))
          )}

          <button
            onClick={onAddTask}
            className="w-full py-2 text-xs text-slate-500 hover:text-indigo-400 hover:bg-slate-700/30 rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add task
          </button>
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Sortable Task Card ───────────────────────────────────────────────────────

function TaskCard({ task, onClick }: { task: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCardUI task={task} onClickCard={onClick} dragHandleProps={listeners} />
    </div>
  );
}

function TaskCardUI({
  task,
  onClickCard,
  dragHandleProps,
}: {
  task: any;
  onClickCard?: () => void;
  dragHandleProps?: any;
}) {
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div
      className={`bg-slate-800 border rounded-lg p-3.5 cursor-pointer hover:border-slate-500 transition-all ${
        overdue ? 'border-rose-500/60 ring-1 ring-rose-500/20' : 'border-slate-700/60'
      }`}
      onClick={onClickCard}
    >
      <div className="flex items-start gap-2 mb-2">
        <span
          {...dragHandleProps}
          className="mt-0.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
        <h4 className="flex-1 font-medium text-white text-sm leading-snug">{task.title}</h4>
        <span
          className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${
            priorityColors[task.priority as keyof typeof priorityColors] ?? 'bg-slate-500'
          } text-white`}
        >
          {(priorityLabels[task.priority as keyof typeof priorityLabels] ?? task.priority)}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-2.5 ml-5">{task.description}</p>
      )}

      <div className="flex items-center justify-between ml-5">
        {task.assignee ? (
          <Avatar
            name={task.assignee.full_name}
            avatarUrl={task.assignee.avatar_url}
            size="sm"
          />
        ) : (
          <span />
        )}
        {task.due_date && (
          <span
            className={`flex items-center gap-1 text-xs ${
              overdue ? 'text-rose-400 font-medium' : 'text-slate-500'
            }`}
          >
            {overdue && <AlertCircle className="w-3 h-3" />}
            <Clock className="w-3 h-3" />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ tasks, loading, onTaskClick, onStatusChange }: any) {
  return (
    <div className="p-6 lg:p-8">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-700/40 rounded animate-pulse" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center">
            <LayoutList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No tasks yet. Create one to get started.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Task</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Assignee</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {tasks.map((task: any) => (
                <tr key={task.id} className="hover:bg-slate-700/20 transition-all">
                  <td className="px-6 py-3.5">
                    <button onClick={() => onTaskClick(task)} className="text-left group">
                      <p className={`font-medium group-hover:text-indigo-400 transition-colors ${isOverdue(task.due_date, task.status) ? 'text-rose-400' : 'text-white'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-3.5">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={task.assignee.full_name} avatarUrl={task.assignee.avatar_url} size="sm" />
                        <span className="text-sm text-slate-300 hidden sm:block">{task.assignee.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors] ?? 'bg-slate-500'} text-white`}>
                      {priorityLabels[task.priority as keyof typeof priorityLabels] ?? task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value)}
                      className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.entries(statusLabels).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-400">
                    {task.due_date ? formatDate(task.due_date) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Members View ─────────────────────────────────────────────────────────────

function MembersView({ project, isAdmin, onUpdate }: any) {
  const [showInvite, setShowInvite] = useState(false);

  async function handleChangeRole(memberId: string, role: string) {
    try {
      await updateMemberRole('', memberId, role);
      toast.success('Role updated');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  }

  async function handleRemoveMember(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from the project?`)) return;
    try {
      await removeMember('', memberId);
      toast.success('Member removed');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  }

  const members = project.project_members ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Team Members</h2>
          <p className="text-slate-400 text-sm mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl divide-y divide-slate-700/40">
        {members.map((member: any) => (
          <div key={member.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={member.user?.full_name ?? '?'}
                avatarUrl={member.user?.avatar_url}
                size="md"
              />
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{member.user?.full_name}</p>
                <p className="text-sm text-slate-400 truncate">{member.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={member.role === 'admin' ? 'warning' : 'default'}>
                {member.role === 'admin' ? 'Admin' : 'Member'}
              </Badge>
              {isAdmin && member.role !== 'admin' && (
                <>
                  <button
                    onClick={() => handleChangeRole(member.id, 'admin')}
                    className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                  >
                    Make Admin
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.id, member.user?.full_name)}
                    className="px-3 py-1.5 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-all"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showInvite && (
        <InviteModal
          projectId={project.id}
          currentMembers={members}
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); onUpdate(); }}
        />
      )}
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────

function SettingsView({ project, onUpdate, onDelete }: any) {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description ?? '',
    color: project.color,
    due_date: project.due_date ?? '',
    status: project.status,
  });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!formData.name.trim()) { toast.error('Project name is required'); return; }
    setLoading(true);
    try {
      await updateProject('', project.id, { ...formData, name: formData.name.trim() });
      toast.success('Project updated');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this project and ALL its tasks? This cannot be undone.')) return;
    try {
      await deleteProject('', project.id);
      toast.success('Project deleted');
      onDelete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project');
    }
  }

  const COLOR_PRESETS = [
    '#6366f1','#8b5cf6','#ec4899','#f43f5e',
    '#f97316','#eab308','#22c55e','#14b8a6','#3b82f6',
  ];

  return (
    <div className="p-6 lg:p-8 max-w-xl space-y-5">
      <h2 className="text-xl font-bold text-white">Project Settings</h2>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all font-medium disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Save Changes
      </button>

      <div className="pt-6 border-t border-slate-700/50">
        <h3 className="text-base font-semibold text-rose-400 mb-1">Danger Zone</h3>
        <p className="text-sm text-slate-400 mb-4">
          Permanently delete this project and all its tasks. This cannot be undone.
        </p>
        <button
          onClick={handleDelete}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all font-medium"
        >
          Delete Project
        </button>
      </div>
    </div>
  );
}

// ─── Task Slide-over ──────────────────────────────────────────────────────────

function TaskSlideOver({
  task, defaultStatus, projectId, project, isAdmin, onClose, onSave, onDelete,
}: any) {
  const isEditing = !!task?.id;
  const [formData, setFormData] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? defaultStatus ?? 'todo',
    priority: task?.priority ?? 'medium',
    assignee_id: task?.assignee_id ?? '',
    due_date: task?.due_date ?? '',
    project_id: projectId,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.title.trim()) e.title = 'Title is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEditing) {
        await updateTask('', task.id, { ...formData, title: formData.title.trim() });
        toast.success('Task updated');
      } else {
        await createTask('', { ...formData, title: formData.title.trim() });
        toast.success('Task created');
      }
      onSave();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  }

  const members = project?.project_members ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-700/50 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-4 py-2.5 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.title ? 'border-rose-500' : 'border-slate-600'}`}
                placeholder="Task title…"
                autoFocus
              />
              {errors.title && <p className="mt-1 text-xs text-rose-400">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Add a description…"
              />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(statusLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(priorityLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                <User className="w-4 h-4 inline mr-1.5 mb-0.5" />
                Assignee
              </label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {members.map((m: any) => (
                  <option key={m.user?.id} value={m.user?.id}>
                    {m.user?.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1.5 mb-0.5" />
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700/50 flex gap-3 flex-shrink-0">
          {isEditing && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ projectId, currentMembers, onClose, onSuccess }: any) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setLoading(true);
    setError('');

    try {
      // Look up user by email
      const { data: foundUser } = await getProfileByEmail('', email.trim());

      // Check if already a member
      const alreadyMember = currentMembers.some(
        (m: any) => m.user?.id === foundUser.id
      );
      if (alreadyMember) {
        setError('This person is already a member');
        return;
      }

      await addProjectMember('', projectId, foundUser.id, role);
      toast.success(`${foundUser.full_name} added to the project!`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Invite Member</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg transition-all">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className={`w-full px-4 py-2.5 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error ? 'border-rose-500' : 'border-slate-600'}`}
              placeholder="member@example.com"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
            <p className="mt-1.5 text-xs text-slate-500">
              The user must have a TaskFlow account already.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
