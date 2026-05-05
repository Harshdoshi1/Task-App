The app has Supabase connected but auth and data are broken. 
Fix everything completely. Go through each step below.

---

STEP 1 — FIX SUPABASE CLIENT

Create src/integrations/supabase/client.ts:
- Import createClient from '@supabase/supabase-js'
- Use import.meta.env.VITE_SUPABASE_URL and import.meta.env.VITE_SUPABASE_ANON_KEY
- Export as: export const supabase = createClient(supabaseUrl, supabaseAnonKey)
- Make sure this single file is imported everywhere — no other supabase 
  instances created anywhere in the app

---

STEP 2 — FIX AUTH CONTEXT

Create src/contexts/AuthContext.tsx:

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true, signOut: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

Wrap the entire app in <AuthProvider> inside main.tsx or App.tsx.

---

STEP 3 — FIX SIGNUP

In the signup form, use exactly this logic:

const handleSignup = async () => {
  if (password !== confirmPassword) {
    toast({ title: 'Passwords do not match', variant: 'destructive' })
    return
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: undefined
    }
  })

  if (error) {
    toast({ title: error.message, variant: 'destructive' })
    return
  }

  if (data.user) {
    // Manually upsert profile in case trigger didn't fire
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      email: email
    })

    toast({ title: 'Account created! Redirecting...' })
    navigate('/dashboard')
  }
}

---

STEP 4 — FIX LOGIN

const handleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    toast({ title: error.message, variant: 'destructive' })
    return
  }

  if (data.user) {
    toast({ title: 'Welcome back!' })
    navigate('/dashboard')
  }
}

---

STEP 5 — FIX PROTECTED ROUTES

Create src/components/ProtectedRoute.tsx:

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

Wrap every route except /login and /signup with <ProtectedRoute>.

---

STEP 6 — FIX PROJECT CREATION

When creating a project, run both inserts in sequence:

const createProject = async () => {
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name,
      description,
      owner_id: user.id,
      color,
      due_date: dueDate || null,
      status: 'active'
    })
    .select()
    .single()

  if (error) {
    toast({ title: error.message, variant: 'destructive' })
    return
  }

  // Add creator as admin member
  await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: user.id,
    role: 'admin'
  })

  toast({ title: 'Project created!' })
  refetchProjects()
}

---

STEP 7 — FIX ALL DATA FETCHING

Fix projects query — always join members to check access:
const { data: projects } = await supabase
  .from('projects')
  .select(`
    *,
    project_members!inner(user_id, role),
    tasks(id, status)
  `)
  .eq('project_members.user_id', user.id)

Fix tasks query for a project:
const { data: tasks } = await supabase
  .from('tasks')
  .select(`
    *,
    assignee:profiles!tasks_assignee_id_fkey(id, full_name, email),
    creator:profiles!tasks_created_by_fkey(id, full_name, email)
  `)
  .eq('project_id', projectId)
  .order('created_at', { ascending: false })

Fix members query for a project:
const { data: members } = await supabase
  .from('project_members')
  .select(`
    *,
    profile:profiles(id, full_name, email, avatar_url)
  `)
  .eq('project_id', projectId)

Fix dashboard stats — scope to user's projects:
const { data: memberRows } = await supabase
  .from('project_members')
  .select('project_id')
  .eq('user_id', user.id)

const projectIds = memberRows?.map(r => r.project_id) ?? []

const today = new Date().toISOString().split('T')[0]
const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString()

const [{ count: dueToday }, { count: overdue }, { count: doneThisWeek }] = 
  await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .in('project_id', projectIds).eq('due_date', today).neq('status', 'done'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .in('project_id', projectIds).lt('due_date', today).neq('status', 'done'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .in('project_id', projectIds).eq('status', 'done').gte('updated_at', weekAgo)
  ])

---

STEP 8 — FIX TASK MUTATIONS

Create task:
const createTask = async (projectId: string, data: TaskForm) => {
  const { error } = await supabase.from('tasks').insert({
    project_id: projectId,
    title: data.title,
    description: data.description || null,
    assignee_id: data.assigneeId || null,
    created_by: user.id,
    status: 'todo',
    priority: data.priority || 'medium',
    due_date: data.dueDate || null
  })

  if (error) toast({ title: error.message, variant: 'destructive' })
  else { toast({ title: 'Task created!' }); refetchTasks() }
}

Update task status (used in Kanban drag-drop):
const updateTaskStatus = async (taskId: string, status: string) => {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) toast({ title: error.message, variant: 'destructive' })
  else refetchTasks()
}

Delete task:
const deleteTask = async (taskId: string) => {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) toast({ title: error.message, variant: 'destructive' })
  else { toast({ title: 'Task deleted' }); refetchTasks() }
}

---

STEP 9 — FIX MEMBER INVITE

const inviteMember = async (email: string) => {
  // Find profile by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (profileError || !profile) {
    toast({ title: 'No user found with that email', variant: 'destructive' })
    return
  }

  // Check not already a member
  const { data: existing } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', profile.id)
    .single()

  if (existing) {
    toast({ title: 'User is already a member', variant: 'destructive' })
    return
  }

  const { error } = await supabase.from('project_members').insert({
    project_id: projectId,
    user_id: profile.id,
    role: 'member'
  })

  if (error) toast({ title: error.message, variant: 'destructive' })
  else { toast({ title: `${profile.full_name} added!` }); refetchMembers() }
}

---

STEP 10 — GENERAL FIXES

1. Every useEffect that fetches data must have the user.id as a dependency
2. Every async function must be wrapped in try/catch with error toast
3. After every insert/update/delete call refetch the relevant data
4. Never use mock or hardcoded data — all state comes from Supabase
5. Make sure all environment variables are VITE_ prefixed
6. Make sure App.tsx has all routes defined:
   - / → redirect to /dashboard
   - /login → LoginPage (public)
   - /signup → SignupPage (public)
   - /dashboard → ProtectedRoute > DashboardPage
   - /projects → ProtectedRoute > ProjectsPage
   - /projects/:id → ProtectedRoute > ProjectDetailPage
   - /my-tasks → ProtectedRoute > MyTasksPage

Fix all TypeScript errors. Remove all placeholder text and mock arrays.
The app must be 100% working with real Supabase data after these fixes.