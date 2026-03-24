

## Plan: Pre-seed Database with Realistic Demo Data

### What
Insert 50+ realistic demo records across all tables (profiles, devices, sessions, event_codes) so the admin dashboard shows impressive charts and populated tables during the hackathon demo.

### Approach
Use the database insert tool to run SQL that populates:

1. **~50 profiles** — Realistic Kenyan university student names with `.ac.ke` emails and registration numbers
2. **~60 devices** — Various browsers (Chrome, Firefox, Safari, Edge) and OS combinations (Windows, macOS, Android, iOS, Linux) with simulated IPs
3. **~120 sessions** — Spread over the past 14 days with varied login/logout times, mix of active/expired statuses
4. **~8 event codes** — Mix of active and expired codes with realistic names (Hackathon 2026, Open Day, Workshop, etc.) and varied usage counts

### Key Details
- Profiles will use `gen_random_uuid()` for IDs since these are demo users without actual auth accounts
- Device and session records will reference the demo profile IDs
- Login times will be distributed across the past 2 weeks so the admin charts (Login Trends, Device Connections) show meaningful patterns
- A few users will be marked `is_blocked = true` and a few devices `is_blocked = true` for demo purposes
- Event codes will include both future (active) and past (expired) entries

### Files Changed
- No code changes — data-only operation via database insert tool

