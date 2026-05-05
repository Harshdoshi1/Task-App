# TaskFlow — One-Time Setup

## Step 1: Run the SQL in Supabase

1. Open your Supabase project: https://supabase.com/dashboard/project/ylbresszbrlvcmlzddwe
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `/RUN_THIS_IN_SUPABASE.sql` in this project
5. Copy the entire contents and paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see: "Success. No rows returned"

That creates:
- `profiles` table + auto-create trigger on signup
- `projects` table
- `project_members` table + auto-add owner as admin trigger
- `tasks` table
- All RLS (Row Level Security) policies

## Step 2: Verify

In Supabase → Table Editor, you should see 4 tables:
- ✅ profiles
- ✅ projects
- ✅ project_members
- ✅ tasks

## Step 3: Use the App

The app now uses the Supabase JS client directly — no Edge Function deployment needed.

1. Sign up for an account
2. Create a project
3. Add tasks to the Kanban board
4. Invite team members by email

## Troubleshooting

**"relation does not exist" error** → SQL hasn't been run yet (Step 1)

**Login works but data doesn't load** → Check RLS policies were created (Step 1 must complete without errors)

**Profile not showing in sidebar** → The `handle_new_user` trigger creates your profile on signup. If you signed up before running the SQL, insert your profile manually:
```sql
INSERT INTO profiles (id, full_name, email)
VALUES (
  auth.uid(),  -- replace with your actual user ID from Auth > Users
  'Your Name',
  'your@email.com'
);
```
