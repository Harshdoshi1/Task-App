-- ============================================================
-- FIX AUTHORIZATION — Drop all old policies & re-apply correct RLS
-- Run this ENTIRE script in your Supabase SQL Editor → Run
-- ============================================================

-- ── STEP 1: Ensure RLS is ENABLED on all tables ───────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ── STEP 2: Drop ALL existing policies (clean slate) ─────────

-- profiles
DROP POLICY IF EXISTS "profiles_select"                                ON profiles;
DROP POLICY IF EXISTS "profiles_insert"                                ON profiles;
DROP POLICY IF EXISTS "profiles_update"                                ON profiles;
DROP POLICY IF EXISTS "Profiles are readable by authenticated users"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"                   ON profiles;

-- projects
DROP POLICY IF EXISTS "projects_select"                                ON projects;
DROP POLICY IF EXISTS "projects_insert"                                ON projects;
DROP POLICY IF EXISTS "projects_update"                                ON projects;
DROP POLICY IF EXISTS "projects_delete"                                ON projects;
DROP POLICY IF EXISTS "Users can view projects they are members of"    ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects"        ON projects;
DROP POLICY IF EXISTS "Project admins can update projects"             ON projects;
DROP POLICY IF EXISTS "Project admins can delete projects"             ON projects;

-- project_members
DROP POLICY IF EXISTS "members_select"                                 ON project_members;
DROP POLICY IF EXISTS "members_insert"                                 ON project_members;
DROP POLICY IF EXISTS "members_update"                                 ON project_members;
DROP POLICY IF EXISTS "members_delete"                                 ON project_members;
DROP POLICY IF EXISTS "Users can view members of their projects"       ON project_members;
DROP POLICY IF EXISTS "Project admins can add members"                 ON project_members;
DROP POLICY IF EXISTS "Project admins can update member roles"         ON project_members;
DROP POLICY IF EXISTS "Project admins can remove members"              ON project_members;

-- tasks
DROP POLICY IF EXISTS "tasks_select"                                   ON tasks;
DROP POLICY IF EXISTS "tasks_insert"                                   ON tasks;
DROP POLICY IF EXISTS "tasks_update"                                   ON tasks;
DROP POLICY IF EXISTS "tasks_delete"                                   ON tasks;
DROP POLICY IF EXISTS "Users can view tasks in their projects"         ON tasks;
DROP POLICY IF EXISTS "Project members can create tasks"               ON tasks;
DROP POLICY IF EXISTS "Project members can update tasks"               ON tasks;
DROP POLICY IF EXISTS "Task creator or project admin can delete tasks" ON tasks;

-- ── STEP 3: Re-create helper functions (SECURITY DEFINER avoids recursion) ──

CREATE OR REPLACE FUNCTION public.is_project_member(pid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = pid
      AND pm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_admin(pid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = pid
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
  );
$$;

-- ── STEP 4: Re-apply correct RLS policies ────────────────────

-- PROFILES: all authenticated users can read; only own row can be updated/inserted
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- PROJECTS: users only see & touch projects they are a member of
CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated
  USING (public.is_project_member(id));

CREATE POLICY "projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING (public.is_project_admin(id));

CREATE POLICY "projects_delete" ON projects
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- PROJECT MEMBERS: users only see members of projects they belong to
CREATE POLICY "members_select" ON project_members
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "members_insert" ON project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_project_admin(project_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "members_update" ON project_members
  FOR UPDATE TO authenticated
  USING (public.is_project_admin(project_id));

CREATE POLICY "members_delete" ON project_members
  FOR DELETE TO authenticated
  USING (public.is_project_admin(project_id));

-- TASKS: users only see & touch tasks inside projects they belong to
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_project_admin(project_id)
  );

-- ============================================================
-- DONE: Authorization is now fully enforced at database level.
-- ============================================================
