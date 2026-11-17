# Ace with Mr. Yeboah

**Learn • Share • Succeed**

Study resources for every UMAT student — course slides, notes, past questions, and more.  
Built for Frank Yeboah (Electrical, UMAT). Closing: **From Frank, for UMAT.**

## Live

Domain (when connected): **https://mryeboah.study**  
Admin: `/admin` (or `https://admin.mryeboah.study` once DNS is set)

## Pages

| Page | Path |
|------|------|
| Home | `index.html` |
| Programmes / courses | `courses.html` |
| Course detail | `course.html?id=` |
| Resources | `resources.html` |
| About | `about.html` |
| Owner Admin | `admin.html` |

Student upload (`forms.html`) is deferred to a later phase.

## Stack

Static HTML / CSS / vanilla JS on **Vercel**.

- **Supabase** — Auth (Admin), Postgres catalog, programmes (wire when ready)
- **Cloudflare R2** — Admin uploads (`source=r2`) when env is set
- Until Supabase is configured, the site shows **sample materials** so browse UI works

## Brand

- Coursebook-inspired cream `#F4F0E7` + forest green `#1F4A36` + ochre accent
- Fonts: Cormorant Garamond (display) · Inter (UI) · DM Mono (labels)
- Programmes: Electrical, Mechanical, Petroleum, Mining, Geology, Geomatics, Logistics and Transport, Computer Science, Data Science, Robotics and AI, Cyber Security, Information Systems, Environmental and Safety, Land Administration, Telecommunication, Spatial Planning, Minerals

## Local preview

```bash
python3 -m http.server 3847 --bind 127.0.0.1
# open http://127.0.0.1:3847
```

## Supabase setup (owner)

1. Create a Supabase project and run the SQL in `supabase/`.
2. Add an Auth user for Frank (Admin sign-in).
3. Put Project URL + anon key in `js/supabase-config.js`.
4. Redeploy. Sample banner disappears once published materials exist.

## R2 (optional, for Admin uploads)

Set on Vercel / Cursor app secrets:

| Variable | Purpose |
|----------|---------|
| `R2_ACCOUNT_ID` | Cloudflare account |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 API token |
| `R2_BUCKET_NAME` | Bucket |
| `R2_PUBLIC_BASE_URL` | Usually `/api/r2-file` |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Server-side Auth checks for R2 routes |
| `ADMIN_EMAILS` | Comma-separated Admin allowlist (required for upload/delete/inbox) |

Security notes (v1):

- `uploads/` files are readable for the public catalog
- `inbox/` is Admin-only (Bearer or short-lived ticket)
- Presign / put / delete require a signed-in Admin on `ADMIN_EMAILS`
- Anonymous form uploads are deferred until a later phase

Inspired by [KB’S BRAIN BANK / boye.study](https://boye.study) and the Coursebook Framer template look.
