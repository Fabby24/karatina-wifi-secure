

## Plan: Remove Registration, Login-Only Portal

### Summary
Remove all signup/registration UI and logic from the login page. The system assumes users are pre-provisioned (via school database integration) with auto-generated credentials sent by email. Only login + event access remain.

### Changes

**`src/pages/Login.tsx` — Simplify to login-only**
- Remove all state variables: `isSignUp`, `fullName`, `regNumber`
- Remove the entire `if (isSignUp)` branch from `handleSubmit`
- Remove the signup form fields (Full Name, Registration Number)
- Remove the "Don't have an account? Register" toggle button
- Update header to always show "WiFi Portal Login" / "Authenticate to access the network"
- Add a small info note: "Use the credentials sent to your university email"
- Remove unused imports (`UserPlus` icon is used for Event Access link so keep it)
- Keep the Event WiFi Access link
- Button always shows "Connect to WiFi"

### Files Changed
- `src/pages/Login.tsx` — Remove signup UI and logic, add credential info note

### No database changes needed

