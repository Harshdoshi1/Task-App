# ⚡ Quick Start Guide

## Before You Use TaskFlow - REQUIRED SETUP

### ⚠️ Step 1: Set Up Database (5 minutes)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project

2. **Run Database Setup**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"
   - Open the `DATABASE_SETUP.sql` file in this project
   - Copy ALL the contents (it's a large SQL file)
   - Paste into Supabase SQL Editor
   - Click "Run" or press Ctrl/Cmd + Enter

3. **Verify Tables Were Created**
   - Go to "Table Editor" in Supabase
   - You should see these tables:
     - ✅ profiles
     - ✅ projects
     - ✅ project_members
     - ✅ tasks

### ✅ Step 2: Deploy Server (1 minute)

1. Go to **Make Settings** (click settings icon in the Make interface)
2. Find the "Supabase" section
3. Click **"Deploy Edge Function"**
4. Wait for "Deployment successful" message

### 🎉 Step 3: Start Using TaskFlow

The app is now ready! Here's what to do:

1. **Create Account**
   - Click "Sign up"
   - Enter full name, email, password
   - Click "Create Account"

2. **Create Your First Project**
   - Click "Projects" in sidebar
   - Click "+ New Project"
   - Fill in project details
   - Click "Create Project"

3. **Add Your First Task**
   - Click on your new project
   - Click "+ Add Task" in any column
   - Fill in task details
   - Click "Create"

4. **Invite Team Members**
   - Ask team members to create their own accounts first
   - Go to project → "Members" tab
   - Click "Invite Member"
   - Enter their exact signup email
   - Select role (Member or Admin)

## Common Issues

### ❌ "Failed to load projects"
**Solution**: You didn't run the DATABASE_SETUP.sql file. Go back to Step 1.

### ❌ "User not found" when inviting
**Solution**: The person needs to sign up for TaskFlow FIRST, then you can invite them using their email.

### ❌ Server errors
**Solution**: Deploy the edge function from Make settings (Step 2).

## Need Help?

- Check the full README.md for detailed documentation
- Verify all setup steps were completed
- Check browser console (F12) for error messages
- Make sure tables exist in Supabase Table Editor

---

**Total setup time**: About 6 minutes
**After setup**: Fully functional team task manager! 🚀
