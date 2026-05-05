# Supabase Setup Guide

## 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Name: `myleague`
4. Region: Choose closest to your users (e.g., Singapore)
5. Plan: Free tier

## 2. Get API Keys
After project creation:
1. Go to **Project Settings** → **API**
2. Copy:
   - `Project URL`
   - `anon/public` key

## 3. Update .env File
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Run SQL Setup
1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy content from `supabase/setup.sql`
4. Click **Run**

## 5. Configure Auth Settings
1. Go to **Authentication** → **Settings**
2. Enable Email provider
3. Disable "Confirm email" for easier testing (or keep enabled for production)
4. Set Site URL: `http://localhost:5173`
5. Add Redirect URLs:
   - `http://localhost:5173`
   - `http://localhost:5173/reset-password`

## 6. Test Connection
```javascript
// In browser console
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})
console.log(data, error)
```

## Troubleshooting

### 401 Unauthorized Error
- Check `.env` values are correct
- Restart dev server after changing `.env`
- Check RLS policies allow the operation

### RLS Policy Errors
Run in SQL Editor to debug:
```sql
-- Check current user
SELECT auth.uid();

-- Check user role
SELECT role FROM profiles WHERE id = auth.uid();
```

### Email Confirmation Issues
1. Go to **Authentication** → **Users**
2. Find user → Click **Confirm email**
3. Or disable email confirmation in Auth Settings

## Database Schema

### Tables Created
1. `profiles` - Extended user info
2. `sports_categories` - Sports types (Football, Tennis, etc.)
3. `clubs` - Sports clubs
4. `club_members` - Club membership
5. `tournaments` - Tournament info
6. `tournament_registrations` - Tournament signups
7. `venues` - Match venues
8. `matches` - Match schedule & results
9. `match_events` - Goals, cards, etc.
10. `standings` - Tournament standings
11. `notifications` - User notifications

### RLS Policies
All tables have Row Level Security enabled with policies for:
- Public read access where appropriate
- Authenticated users can create their own data
- Admins have full access
- Club leaders can manage their clubs
- Referees can update matches

## Next Steps
1. Create admin user via Supabase Auth
2. Update their role to 'admin' in profiles table
3. Add sports categories
4. Create first tournament!
