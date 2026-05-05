# ⚡ TaskFlow - Complete Setup Instructions

## 🎯 You're 2 Steps Away From Using TaskFlow!

Everything is already built. You just need to:
1. Run the SQL in Supabase (2 minutes)
2. Deploy the edge function (30 seconds)

---

## Step 1: Run Database Migration in Supabase

### 1.1 Open Supabase SQL Editor
1. Go to https://supabase.com
2. Open your project: **ylbresszbrlvcmlzddwe**
3. Click **"SQL Editor"** in the left sidebar
4. Click **"+ New query"**

### 1.2 Copy and Run the SQL
1. Open the file: **`RUN_THIS_IN_SUPABASE.sql`** (in this project)
2. **Copy the ENTIRE file** (it's about 200 lines)
3. **Paste** into the Supabase SQL Editor
4. Click **"RUN"** or press `Ctrl/Cmd + Enter`

### 1.3 Verify Success
After running, you should see:
- ✅ Success message in Supabase
- Go to "Table Editor" and verify these 4 tables exist:
  - `profiles`
  - `projects`
  - `project_members`
  - `tasks`

---

## Step 2: Deploy the Edge Function

### 2.1 Go to Make Settings
1. In your Make interface, find the **Settings icon** (gear/cog icon)
2. Click it to open Make Settings

### 2.2 Deploy
1. Find the **"Supabase"** section
2. Click the **"Deploy Edge Function"** button
3. Wait for **"Deployment successful"** message (takes ~30 seconds)

---

## 🎉 You're Done! Start Using TaskFlow

The app is now **fully functional**. Here's what to do:

### First Time Setup
1. **Sign Up**
   - Click "Sign up" 
   - Enter: Full Name, Email, Password
   - Click "Create Account"
   - You'll be auto-logged in

2. **Create Your First Project**
   - Click "Projects" in sidebar
   - Click "+ New Project"
   - Enter project name (required)
   - Choose a color
   - Click "Create Project"
   - You're automatically added as Admin

3. **Add Your First Task**
   - Click on your project
   - You'll see the Kanban board with 4 columns
   - Click "+ Add Task" in any column
   - Fill in task details
   - Click "Create"
   - **Try dragging it** to another column!

4. **Invite Team Members**
   - Ask teammates to sign up first (they need accounts)
   - Go to your project → "Members" tab
   - Click "Invite Member"
   - Enter their exact signup email
   - Choose role: Member or Admin
   - Click "Invite"

---

## ✨ What You Can Do

### Dashboard (`/dashboard`)
- See stats: Total Projects, Due Today, Overdue, Completed This Week
- View your assigned tasks across all projects
- See recent projects with progress bars

### Projects (`/projects`)
- Grid or List view toggle
- Search and filter projects
- Create new projects
- Archive or delete projects (admins only)

### Project Detail (`/projects/:id`)
- **Board Tab**: Drag-and-drop Kanban board
- **List Tab**: Table view with inline status updates
- **Members Tab**: Invite/remove members, change roles
- **Settings Tab**: Edit project details (admins only)

### My Tasks (`/my-tasks`)
- All tasks assigned to you
- Filter by status and priority
- Sort by due date, priority, or created date
- Quick status updates

---

## 🎨 Features You'll Love

✅ **Drag & Drop** - Move tasks between Kanban columns  
✅ **Real-time Updates** - Changes save instantly to Supabase  
✅ **Role-Based Access** - Admins can manage, Members can collaborate  
✅ **Overdue Warnings** - Overdue tasks highlighted in red  
✅ **Priority Colors** - Low/Medium/High/Urgent color coding  
✅ **Toast Notifications** - Success/error messages for all actions  
✅ **Loading States** - Smooth skeletons while data loads  
✅ **Responsive** - Works on desktop, tablet, and mobile  
✅ **Dark Theme** - Beautiful glassmorphism UI  

---

## 🔐 Role Permissions

### Admin Can:
- ✅ Edit project name, description, color, due date
- ✅ Archive or delete the project
- ✅ Invite new members
- ✅ Remove members
- ✅ Change member roles
- ✅ Create, edit, and delete any task
- ✅ Access Settings tab

### Member Can:
- ✅ View all project data
- ✅ Create tasks
- ✅ Edit tasks
- ✅ Update task status
- ✅ Delete tasks they created
- ❌ Cannot access Settings
- ❌ Cannot manage members
- ❌ Cannot delete the project

---

## 🚨 Common Issues

### "Failed to load projects"
**Cause**: Database not set up  
**Fix**: Go back to Step 1 and run the SQL file

### "User not found" when inviting
**Cause**: The person hasn't signed up yet  
**Fix**: They must create an account FIRST, then you can invite them

### Server errors / API failures
**Cause**: Edge function not deployed  
**Fix**: Go to Make Settings → Deploy Edge Function

### Tables don't exist in Supabase
**Cause**: SQL migration didn't run successfully  
**Fix**: 
1. Go to Supabase SQL Editor
2. Copy `RUN_THIS_IN_SUPABASE.sql` again
3. Make sure you copy the ENTIRE file
4. Paste and run

---

## 📊 What's Built

### Backend (Supabase)
- ✅ 4 database tables with proper foreign keys
- ✅ Row Level Security (RLS) policies on all tables
- ✅ Triggers for auto-creating profiles and adding owners as admins
- ✅ Edge function with 20+ API endpoints
- ✅ JWT authentication with session management

### Frontend (React)
- ✅ Authentication pages (login/signup)
- ✅ Protected routes with AuthProvider
- ✅ Sidebar navigation with mobile support
- ✅ Dashboard with real-time stats
- ✅ Projects page (grid/list views)
- ✅ Project detail with 4 tabs (Board/List/Members/Settings)
- ✅ Kanban board with drag-and-drop
- ✅ My Tasks page with filters
- ✅ Task detail slide-over panel
- ✅ Toast notifications
- ✅ Loading skeletons
- ✅ Form validation
- ✅ Error handling

---

## 🎯 Quick Checklist

Before using the app, verify:
- [ ] Ran `RUN_THIS_IN_SUPABASE.sql` in Supabase SQL Editor
- [ ] Verified 4 tables exist in Supabase Table Editor
- [ ] Deployed Edge Function from Make Settings
- [ ] Saw "Deployment successful" message

If all checked, **you're ready to go!** 🚀

---

## 🎉 Start Now

1. Open the TaskFlow app in Make
2. Click "Sign up"
3. Create your account
4. Build your first project!

**Need help?** Check the browser console (F12) for error messages or verify the setup steps above.

Enjoy TaskFlow! ⚡
