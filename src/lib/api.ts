/**
 * API layer — all calls use the Supabase JS client directly.
 * Token parameters are kept for backwards compatibility with existing
 * component call sites but are not used (the client manages the session).
 */
import { supabase } from './supabase';

// ─────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────

export async function getProjects(_token?: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(id, full_name, email, avatar_url),
      project_members(
        id,
        role,
        user:profiles(id, full_name, email, avatar_url)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return { data: data ?? [] };
}

export async function getProject(_token: string, id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(id, full_name, email, avatar_url),
      project_members(
        id,
        role,
        user:profiles(id, full_name, email, avatar_url)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return { data };
}

export async function createProject(_token: string, projectData: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: projectData.name,
      description: projectData.description || null,
      color: projectData.color || '#6366f1',
      due_date: projectData.due_date || null,
      status: 'active',
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { data };
}

export async function updateProject(_token: string, id: string, updates: any) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { data };
}

export async function deleteProject(_token: string, id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}

// ─────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────

const TASK_SELECT = `
  *,
  assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, avatar_url),
  created_by_user:profiles!tasks_created_by_fkey(id, full_name, email)
`;

export async function getProjectTasks(_token: string, projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return { data: data ?? [] };
}

export async function getMyTasks(_token?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects(id, name, color),
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, avatar_url)
    `)
    .eq('assignee_id', user.id)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return { data: data ?? [] };
}

export async function createTask(_token: string, taskData: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: taskData.project_id,
      title: taskData.title,
      description: taskData.description || null,
      assignee_id: taskData.assignee_id || null,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      due_date: taskData.due_date || null,
      created_by: user.id,
    })
    .select(TASK_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return { data };
}

export async function updateTask(_token: string, id: string, updates: any) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select(TASK_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return { data };
}

export async function deleteTask(_token: string, id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}

// ─────────────────────────────────────────────
// PROJECT MEMBERS
// ─────────────────────────────────────────────

export async function addProjectMember(
  _token: string,
  projectId: string,
  userId: string,
  role: string = 'member'
) {
  const { data, error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId, role })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { data };
}

export async function updateMemberRole(_token: string, memberId: string, role: string) {
  const { data, error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { data };
}

export async function removeMember(_token: string, memberId: string) {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('id', memberId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getProfileByEmail(_token: string, email: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !data) throw new Error('No user found with that email');
  return { data };
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

export async function getDashboardStats(_token?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get all project IDs the user is a member of
  const { data: memberRows, error: memberError } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id);

  if (memberError) throw new Error(memberError.message);

  const projectIds = (memberRows ?? []).map((r: any) => r.project_id);

  if (projectIds.length === 0) {
    return { data: { totalProjects: 0, dueToday: 0, overdue: 0, completedThisWeek: 0 } };
  }

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalProjects },
    { count: dueToday },
    { count: overdue },
    { count: completedThisWeek },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('id', projectIds)
      .eq('status', 'active'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('due_date', today)
      .neq('status', 'done'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .lt('due_date', today)
      .neq('status', 'done'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('status', 'done')
      .gte('updated_at', weekAgo),
  ]);

  return {
    data: {
      totalProjects: totalProjects ?? 0,
      dueToday: dueToday ?? 0,
      overdue: overdue ?? 0,
      completedThisWeek: completedThisWeek ?? 0,
    },
  };
}
