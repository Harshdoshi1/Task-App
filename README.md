# TaskFlow ⚡

A beautiful full-stack team task manager built with React, Supabase, and Tailwind CSS. Features include project management, Kanban boards, real-time collaboration, and role-based access control.

## 🚀 Features

- **Authentication** - Secure email/password signup and login with Supabase Auth
- **Dashboard** - Overview of projects, tasks, and activity with animated stats
- **Projects** - Create, manage, and collaborate on team projects
- **Kanban Board** - Drag-and-drop task management with real-time updates
- **Task Management** - Assign tasks, set priorities, due dates, and track progress
- **Team Collaboration** - Invite members, manage roles (Admin/Member)
- **Role-Based Access** - Admins can manage projects and members, members can manage tasks
- **My Tasks** - Personalized view of all assigned tasks across projects
- **Dark Theme** - Beautiful glassmorphism UI with smooth animations
- **Responsive** - Works perfectly on desktop, tablet, and mobile

## 🎨 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Server**: Hono (Deno edge runtime)
- **UI Components**: Radix UI, Motion (Framer Motion), Sonner
- **Drag & Drop**: dnd-kit
- **Routing**: React Router v7

## 📋 Prerequisites

Before you begin, you need:

1. A Supabase account (free tier works great)
2. Your Supabase project connected to this Make file

## 🗄️ Database Setup

**IMPORTANT**: You must run the database setup SQL before using the application.

### Step 1: Open Your Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run the Database Schema

1. Open the `DATABASE_SETUP.sql` file in this project
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor
4. Click "Run" or press `Ctrl/Cmd + Enter`

This will create:
- ✅ All required tables (profiles, projects, project_members, tasks)
- ✅ Row Level Security (RLS) policies
- ✅ Database triggers (auto-create profile, auto-add project owner as admin)
- ✅ Indexes for performance

### Step 3: Verify Setup

After running the SQL, verify that these tables exist in your Supabase project:
- `profiles`
- `projects`
- `project_members`
- `tasks`

You can check this in the "Table Editor" section of your Supabase dashboard.

## 🚀 Deploying the Edge Function

After setting up the database, you need to deploy the Supabase Edge Function:

1. Go to the **Make settings page** (click the settings icon in Make)
2. Find the "Supabase" section
3. Click **"Deploy Edge Function"**

This deploys the server code from `/supabase/functions/server/index.tsx` to handle authentication and all API requests.

**Note**: Whenever you make changes to the server code, you'll need to redeploy the edge function from the Make settings page.

## 👤 Creating Your First Account

1. The app will open to the login page
2. Click "Sign up" to create a new account
3. Enter your full name, email, and password
4. Click "Create Account"
5. You'll be automatically logged in

**Note**: Email confirmation is automatically handled since this is a development environment.

## 🎯 Using TaskFlow

### Creating Projects

1. Navigate to "Projects" from the sidebar
2. Click "New Project"
3. Enter project details:
   - Name (required, 3-50 characters)
   - Description (optional)
   - Color (for visual identification)
   - Due date (optional)
4. Click "Create Project"

You'll automatically be added as an admin for projects you create.

### Managing Tasks

**On the Kanban Board:**
- Drag and drop tasks between columns (To Do, In Progress, In Review, Done)
- Click "+ Add Task" in any column to create a task
- Click on a task card to edit it

**On the List View:**
- See all tasks in a table format
- Change status inline with dropdowns
- Sort by different columns

**Task Properties:**
- Title (required)
- Description
- Status (To Do, In Progress, In Review, Done)
- Priority (Low, Medium, High, Urgent)
- Assignee (must be a project member)
- Due date

### Inviting Team Members

1. Go to a project's "Members" tab (project detail page)
2. Click "Invite Member"
3. Enter the email address of an **existing TaskFlow user**
4. Select their role (Member or Admin)
5. Click "Invite"

**Important**: Only users who have already signed up for TaskFlow can be invited. Ask them to create an account first.

### Role Permissions

**Admin**:
- Edit/delete the project
- Manage project members (invite, remove, change roles)
- Create/edit/delete any task
- Access the Settings tab

**Member**:
- View all project data
- Create tasks
- Edit and update tasks
- Cannot delete tasks (unless they created them)
- Cannot access Settings or manage members

### My Tasks Page

- Shows all tasks assigned to you across all projects
- Filter by status and priority
- Sort by due date, priority, or created date
- Click on any task to jump to its project
- Update status directly from the list

## 🎨 UI Features

- **Glassmorphism cards** with backdrop blur
- **Smooth animations** using Motion
- **Toast notifications** for all actions
- **Loading skeletons** while data loads
- **Overdue task warnings** with visual indicators
- **Avatar fallbacks** showing user initials
- **Responsive mobile menu** with hamburger toggle
- **Color-coded priorities** and statuses

## 🔐 Security

- All data is protected with Row Level Security (RLS)
- Users can only see projects they're members of
- Only admins can modify project settings
- Task permissions are role-based
- Access tokens are validated on every API request

## 🛠️ Troubleshooting

### "Failed to load projects/tasks"

1. Verify you ran the `DATABASE_SETUP.sql` file
2. Check that all tables exist in Supabase
3. Ensure the edge function is deployed
4. Check browser console for error messages

### "User not found" when inviting members

The email must match a user who has already signed up. Ask them to create an account first, then invite them using the exact email they registered with.

### Database changes not reflecting

If you modify tables manually in Supabase:
1. This is not recommended for Make projects
2. Use the built-in KV store when possible
3. Or work with the existing schema

### Server changes not working

After editing files in `/supabase/functions/server/`, remember to:
1. Go to Make settings
2. Click "Deploy Edge Function"
3. Wait for deployment to complete

## 📝 Notes

- The app uses Supabase's built-in authentication (no email server configured, so email confirmation is automatic)
- All dates and times are stored in UTC
- The dark theme is optimized for readability and reduced eye strain
- Drag-and-drop works on both desktop and touch devices

## 🎉 Getting Started

1. ✅ Run `DATABASE_SETUP.sql` in Supabase SQL Editor
2. ✅ Deploy the edge function from Make settings
3. ✅ Create your first account
4. ✅ Create a project
5. ✅ Invite team members
6. ✅ Start managing tasks!

Enjoy using TaskFlow! ⚡
