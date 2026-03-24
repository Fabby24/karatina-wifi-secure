

## Plan: Restrict Registration to `.ac.ke` Emails

### What
Only allow users with emails ending in `.ac.ke` (Kenyan academic institutions) to register.

### Implementation

**1. Client-side validation** — Update `Login.tsx` to validate the email domain before calling signup, showing an error like "Only academic emails (.ac.ke) are allowed."

**2. Server-side enforcement** — Create a database function + trigger on `auth.users` that rejects inserts where the email doesn't end with `.ac.ke`. This prevents bypassing the UI.

Actually, since we cannot attach triggers to `auth.users` (reserved schema), the server-side approach will be:
- Create a **database function** that validates email domain
- Add a **trigger on `profiles`** table (which is populated via `handle_new_user`) to reject non-`.ac.ke` emails — however this would create an orphaned auth user.

The cleanest approach: **use a Supabase Edge Function** as a pre-signup hook, or simply enforce it **client-side + via an RLS policy on profiles**.

**Revised approach — keep it simple and effective:**

1. **Client-side** (`Login.tsx`): Check `email.endsWith('.ac.ke')` before signup. Show toast error if not.
2. **Database migration**: Add a validation trigger on the `profiles` table that raises an exception if the email doesn't end with `.ac.ke`, preventing profile creation (and effectively blocking the signup flow).

### Files Changed
- `src/pages/Login.tsx` — Add email domain validation before signup call
- New migration — Add email domain validation trigger on `profiles` table

