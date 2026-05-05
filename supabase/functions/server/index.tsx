import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// Supabase clients
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const supabaseAnon = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to verify user authentication
async function verifyUser(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  return { user, error: error?.message };
}

// ============================================
// AUTH ROUTES
// ============================================

// Sign up
app.post("/make-server-be9aa4c1/auth/signup", async (c) => {
  try {
    const { email, password, full_name } = await c.req.json();

    if (!email || !password || !full_name) {
      return c.json({ error: 'Email, password, and full name are required' }, 400);
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ data });
  } catch (err) {
    console.log(`Server error during signup: ${err.message}`);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// ============================================
// PROFILE ROUTES
// ============================================

// Get current user profile
app.get("/make-server-be9aa4c1/profile", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const { data, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.log(`Error fetching profile: ${profileError.message}`);
    return c.json({ error: profileError.message }, 400);
  }

  return c.json({ data });
});

// Update profile
app.put("/make-server-be9aa4c1/profile", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const updates = await c.req.json();

  const { data, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) {
    console.log(`Error updating profile: ${updateError.message}`);
    return c.json({ error: updateError.message }, 400);
  }

  return c.json({ data });
});

// Get profile by email (for inviting members)
app.get("/make-server-be9aa4c1/profiles/by-email/:email", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const email = c.req.param('email');

  const { data, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (fetchError) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ data });
});

// ============================================
// PROJECT ROUTES
// ============================================

// Get all projects for user
app.get("/make-server-be9aa4c1/projects", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const { data, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(*),
      project_members(
        id,
        role,
        user:profiles(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.log(`Error fetching projects: ${fetchError.message}`);
    return c.json({ error: fetchError.message }, 400);
  }

  return c.json({ data });
});

// Get single project
app.get("/make-server-be9aa4c1/projects/:id", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const projectId = c.req.param('id');

  const { data, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(*),
      project_members(
        id,
        role,
        user:profiles(*)
      )
    `)
    .eq('id', projectId)
    .single();

  if (fetchError) {
    console.log(`Error fetching project ${projectId}: ${fetchError.message}`);
    return c.json({ error: fetchError.message }, 404);
  }

  return c.json({ data });
});

// Create project
app.post("/make-server-be9aa4c1/projects", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const projectData = await c.req.json();
  projectData.owner_id = user.id;

  const { data, error: createError } = await supabaseAdmin
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (createError) {
    console.log(`Error creating project: ${createError.message}`);
    return c.json({ error: createError.message }, 400);
  }

  return c.json({ data });
});

// Update project
app.put("/make-server-be9aa4c1/projects/:id", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const projectId = c.req.param('id');
  const updates = await c.req.json();

  const { data, error: updateError } = await supabaseAdmin
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (updateError) {
    console.log(`Error updating project ${projectId}: ${updateError.message}`);
    return c.json({ error: updateError.message }, 400);
  }

  return c.json({ data });
});

// Delete project
app.delete("/make-server-be9aa4c1/projects/:id", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const projectId = c.req.param('id');

  const { error: deleteError } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (deleteError) {
    console.log(`Error deleting project ${projectId}: ${deleteError.message}`);
    return c.json({ error: deleteError.message }, 400);
  }

  return c.json({ success: true });
});

// ============================================
// PROJECT MEMBER ROUTES
// ============================================

// Add member to project
app.post("/make-server-be9aa4c1/projects/:id/members", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const projectId = c.req.param('id');
  const { user_id, role = 'member' } = await c.req.json();

  const { data, error: insertError } = await supabaseAdmin
    .from('project_members')
    .insert({ project_id: projectId, user_id, role })
    .select()
    .single();

  if (insertError) {
    console.log(`Error adding member to project ${projectId}: ${insertError.message}`);
    return c.json({ error: insertError.message }, 400);
  }

  return c.json({ data });
});

// Update member role
app.put("/make-server-be9aa4c1/project-members/:id", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const memberId = c.req.param('id');
  const { role } = await c.req.json();

  const { data, error: updateError } = await supabaseAdmin
    .from('project_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();

  if (updateError) {
    console.log(`Error updating member ${memberId}: ${updateError.message}`);
    return c.json({ error: updateError.message }, 400);
  }

  return c.json({ data });
});

// Remove member from project
app.delete("/make-server-be9aa4c1/project-members/:id", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const memberId = c.req.param('id');

  const { error: deleteError } = await supabaseAdmin
    .from('project_members')
    .delete()
    .eq('id', memberId);

  if (deleteError) {
    console.log(`Error removing member ${memberId}: ${deleteError.message}`);
    return c.json({ error: deleteError.message }, 400);
  }

  return c.json({ success: true });
});

// ============================================
// TASK ROUTES
// ============================================

// Get tasks for project
app.get("/make-server-be9aa4c1/projects/:id/tasks", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const projectId = c.req.param('id');

  const { data, error: fetchError } = await supabaseAdmin
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(*),
      created_by_user:profiles!tasks_created_by_fkey(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.log(`Error fetching tasks for project ${projectId}: ${fetchError.message}`);
    return c.json({ error: fetchError.message }, 400);
  }

  return c.json({ data });
});

// Get tasks assigned to current user
app.get("/make-server-be9aa4c1/my-tasks", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const { data, error: fetchError } = await supabaseAdmin
    .from('tasks')
    .select(`
      *,
      project:projects(*),
      assignee:profiles!tasks_assignee_id_fkey(*),
      created_by_user:profiles!tasks_created_by_fkey(*)
    `)
    .eq('assignee_id', user.id)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (fetchError) {
    console.log(`Error fetching user tasks: ${fetchError.message}`);
    return c.json({ error: fetchError.message }, 400);
  }

  return c.json({ data });
});

// Create task
app.post("/make-server-be9aa4c1/tasks", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const taskData = await c.req.json();
  taskData.created_by = user.id;

  const { data, error: createError } = await supabaseAdmin
    .from('tasks')
    .insert(taskData)
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(*),
      created_by_user:profiles!tasks_created_by_fkey(*)
    `)
    .single();

  if (createError) {
    console.log(`Error creating task: ${createError.message}`);
    return c.json({ error: createError.message }, 400);
  }

  return c.json({ data });
});

// Update task
app.put("/make-server-be9aa4c1/tasks/:id", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const updates = await c.req.json();

  const { data, error: updateError } = await supabaseAdmin
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(*),
      created_by_user:profiles!tasks_created_by_fkey(*)
    `)
    .single();

  if (updateError) {
    console.log(`Error updating task ${taskId}: ${updateError.message}`);
    return c.json({ error: updateError.message }, 400);
  }

  return c.json({ data });
});

// Delete task
app.delete("/make-server-be9aa4c1/tasks/:id", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');

  const { error: deleteError } = await supabaseAdmin
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (deleteError) {
    console.log(`Error deleting task ${taskId}: ${deleteError.message}`);
    return c.json({ error: deleteError.message }, 400);
  }

  return c.json({ success: true });
});

// ============================================
// DASHBOARD STATS ROUTES
// ============================================

// Get dashboard statistics
app.get("/make-server-be9aa4c1/dashboard/stats", async (c) => {
  const { user, error } = await verifyUser(c.req.header('Authorization'));
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    // Get user's project IDs
    const { data: memberProjects } = await supabaseAdmin
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id);

    const projectIds = memberProjects?.map(pm => pm.project_id) || [];

    if (projectIds.length === 0) {
      return c.json({
        data: {
          totalProjects: 0,
          dueToday: 0,
          overdue: 0,
          completedThisWeek: 0
        }
      });
    }

    // Total active projects
    const { count: totalProjects } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('id', projectIds)
      .eq('status', 'active');

    // Tasks due today
    const today = new Date().toISOString().split('T')[0];
    const { count: dueToday } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('due_date', today)
      .neq('status', 'done');

    // Overdue tasks
    const { count: overdue } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .lt('due_date', today)
      .neq('status', 'done');

    // Tasks completed this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: completedThisWeek } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('status', 'done')
      .gte('updated_at', weekAgo.toISOString());

    return c.json({
      data: {
        totalProjects: totalProjects || 0,
        dueToday: dueToday || 0,
        overdue: overdue || 0,
        completedThisWeek: completedThisWeek || 0
      }
    });
  } catch (err) {
    console.log(`Error fetching dashboard stats: ${err.message}`);
    return c.json({ error: 'Error fetching dashboard statistics' }, 500);
  }
});

// Health check endpoint
app.get("/make-server-be9aa4c1/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);