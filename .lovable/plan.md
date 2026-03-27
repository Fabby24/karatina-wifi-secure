

## Plan: Captive Portal Simulation Upgrade

### Summary
Transform the existing system into a realistic captive portal experience with splash screen, gateway simulation, access-granted page, auto-redirect, real-time notifications, and auto-logout.

### Changes

**1. Captive Portal Splash Page — `src/pages/Index.tsx` (rewrite)**
- Route: `/`
- Animated "Detecting network..." then "Redirecting to SecureLab..." with WiFi pulse animation
- Auto-redirect to `/login` after 2.5 seconds
- If user is already authenticated, redirect to `/dashboard` or `/admin`

**2. Move Login to `/login` — `src/pages/Login.tsx` (minor update)**
- No major changes; already fully featured
- Add multi-step loading states after successful auth: "Verifying credentials..." → "Registering device..." → "Granting network access..."
- Add gateway simulation call (`POST http://192.168.137.1:3000/allow`) that fails silently
- On success, redirect to `/access-granted` instead of `/dashboard`

**3. New Access Granted Page — `src/pages/AccessGranted.tsx` (new)**
- Route: `/access-granted`
- Large animated success checkmark, "Access Granted" message
- Show device name, IP address, session status
- Progress bar counting down 3 seconds
- Auto-redirect to `https://google.com` (simulating internet access)
- "Go to Dashboard" link as alternative

**4. Upgrade Event Access — `src/pages/EventAccess.tsx` (update)**
- Read `?code=` from URL query params on mount (for QR scan support)
- Add gateway simulation call on success
- On success, redirect to `/access-granted` instead of showing inline success
- Log an anonymous session in the sessions table

**5. Update Routes — `src/App.tsx`**
- `/` → `Index` (splash)
- `/login` → `Login`
- `/access-granted` → `AccessGranted` (auth-guarded)
- Keep all other routes as-is

**6. Gateway Simulation Helper — `src/lib/gateway.ts` (new)**
- `callGateway()` function that POSTs to `http://192.168.137.1:3000/allow` with device info
- Wraps in try/catch, fails silently (returns boolean)
- Reusable from Login and EventAccess

**7. Real-time Notifications in Admin — `src/pages/admin/AdminOverview.tsx` (update)**
- Show toast notifications when new sessions or devices are created via the existing realtime subscription
- Add "New device connected" / "New user logged in" toast alerts

**8. Auto-Logout After Inactivity — `src/hooks/useAutoLogout.ts` (new)**
- Track mouse/keyboard/touch events
- After 2 hours of inactivity, expire session in DB and call `signOut()`
- Use in `DashboardLayout.tsx`

**9. Search & Filter on Admin Pages — `src/pages/admin/AdminUsers.tsx`, `AdminDevices.tsx` (update)**
- Add search input filtering (already exists in AdminSessions; replicate pattern)

### Files Changed
- `src/pages/Index.tsx` — Rewrite as captive portal splash
- `src/pages/Login.tsx` — Multi-step loading states, gateway call, redirect to access-granted
- `src/pages/AccessGranted.tsx` — New page
- `src/pages/EventAccess.tsx` — URL query param support, gateway call, redirect
- `src/App.tsx` — Update routes
- `src/lib/gateway.ts` — New gateway simulation helper
- `src/hooks/useAutoLogout.ts` — New auto-logout hook
- `src/components/DashboardLayout.tsx` — Integrate auto-logout
- `src/pages/admin/AdminOverview.tsx` — Real-time toast notifications

### No database changes needed
All tables (profiles, devices, sessions, event_codes) already support every feature listed.

