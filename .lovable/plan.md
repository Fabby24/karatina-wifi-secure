

## Plan: Remove Registration & Add AI-Powered Threat Detection

### Part 1: Remove Registration from Login Page

**`src/pages/Login.tsx`**
- Remove all signup-related state (`isSignUp`, `fullName`, `regNumber`) and the entire signup branch from `handleSubmit`
- Remove signup form fields (Full Name, Registration Number) and the "Register" toggle button
- Add an info note below the form: "Your login credentials were sent to your university email. Contact IT support if you haven't received them."
- Header always shows "WiFi Portal Login"
- Button always shows "Connect to WiFi"
- Keep the Event WiFi Access link

### Part 2: AI-Powered Threat Detection Edge Function

Create a backend function `analyze-device` that uses Lovable AI to evaluate each device connection for suspicious activity.

**`supabase/functions/analyze-device/index.ts`** (new)
- Receives device info (browser, OS, IP, user_id, device history)
- Queries the database for the user's known devices and recent session patterns
- Sends context to AI (Gemini Flash) with a security-analyst system prompt asking it to score the connection as safe/suspicious/malicious based on:
  - Unknown browser/OS combination for this user
  - Unusual IP pattern changes
  - Rapid logins from different devices
  - Known phishing user-agent signatures
- Returns a threat score (0-100) and reason
- If score > 70: automatically blocks the device in the `devices` table

**Database changes:**
- Add `threat_score` (integer, default 0) and `threat_reason` (text, nullable) columns to the `devices` table

**`src/lib/deviceInfo.ts`** (update)
- After registering a device, call the `analyze-device` edge function
- If the device is auto-blocked, show a warning toast and sign the user out

**`src/pages/admin/AdminDevices.tsx`** (update)
- Add a "Threat Score" column showing a color-coded badge (green < 30, yellow 30-70, red > 70)
- Display the AI-generated threat reason on hover or in a tooltip
- Add a "Run AI Scan" button that re-analyzes all active devices

**`src/pages/admin/AdminOverview.tsx`** (update)
- Add a new stat card: "Threats Blocked" showing count of auto-blocked devices
- Add a "Security Alerts" section showing recent AI-flagged devices

### Technical Details

- The AI prompt instructs the model to act as a network security analyst evaluating device fingerprints
- The edge function uses `LOVABLE_API_KEY` (already configured) to call Lovable AI
- Threat analysis runs on every new device registration (not on returning devices)
- Admins can manually unblock false positives from the devices page
- The system logs the AI's reasoning so admins can audit decisions

### Files Changed
- `src/pages/Login.tsx` — Remove signup UI/logic, add credential info note
- `supabase/functions/analyze-device/index.ts` — New AI threat detection function
- `src/lib/deviceInfo.ts` — Call threat analysis after device registration
- `src/pages/admin/AdminDevices.tsx` — Show threat scores, add scan button
- `src/pages/admin/AdminOverview.tsx` — Threats blocked stat + security alerts
- Database migration — Add `threat_score` and `threat_reason` to devices table

