# Docket

Android-first Expo app for UMAT study resources — **by Mr. Yeboah**.

Student-facing companion to the Ace static site in this repo. Admin uploads stay on the web; this app is browse → preview → download / learn offline.

## Stack

- Expo SDK 58 + **Expo Router** (TypeScript)
- Theme: Ace cream / deep red / ochre (`constants/theme.ts`)
- Auth: **Supabase phone OTP** (mockable without keys)
- Sample catalogue stubs mirror Ace programmes (`constants/catalog.ts`)

## Tabs & screens

| Screen | Route |
|--------|--------|
| Splash auth | `/` — *Docket* mid + *by Mr. Yeboah*; shrinks into phone OTP / Sign up |
| Home | `/(tabs)` — greeting + **name**, carousel, trending |
| Libraries | `/(tabs)/libraries` → programme → course → resources |
| Resource | `/resource/[resourceId]` — preview, open viewer, download |
| Viewer | `/viewer/[resourceId]` — page-first stub |
| Downloads | `/(tabs)/downloads` — offline list (OTP gated) |
| Profile | `/(tabs)/profile` — **name** hero, programme, settings |
| Phone OTP | `/auth/phone` (+ auth gate sheet on download) |

Browse is free. **Download** and **progress** require sign-in. Splash **Sign up** collects name + programme + phone, then OTP → Home.

## Local Android run

Requirements: Node 20+, Android Studio / emulator (or a device with USB debugging), Expo Go optional for quick preview.

```bash
cd docket-app
npm install
cp .env.example .env   # optional — omit keys to use mock OTP (code 123456)
npm run android
# or
npx expo start --android
```

Without an emulator, start the bundler and scan with Expo Go:

```bash
npx expo start
```

### Mock auth

If `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing or still placeholders:

1. On splash, enter phone → Continue, or **Sign up** (name, programme, number).
2. Enter OTP **`123456`** (mock only; not shown in UI).
3. Land on Home with your name in the hero.

### Live Supabase (Yeboah project)

`app.config.js` maps **only** the Project URL + anon key into `expo.extra`:
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`.env` / EAS) win, else
`YEBOAH_SUPABASE_URL` / `YEBOAH_SUPABASE_ANON_KEY` (Cloud Agent secrets). Restart Expo
(`npx expo start -c`) after changing them. Never add the service role key, access token,
DB password or BulkClix key to the app.

When configured:

- Catalogue comes from `programmes`, `courses` and published `materials` (public read).
  Courses are also derived from `materials.course_code` + `department`, so Ace web uploads show up.
- Phone OTP uses `supabase.auth.signInWithOtp` / `verifyOtp`. SMS goes out through the
  `send-sms-hook` Edge Function (Supabase Send SMS hook → BulkClix).
- Viewer opens save `reading_progress`, bookmarks save to `bookmarks`, downloads record to
  `downloads` (all owner-only RLS, signed-in users only).

Backend setup lives in `../supabase/schema_docket.sql` and `../supabase/functions/send-sms-hook/`.

## Brand

- Paper `#F3F0E6` · Deep red `#7A1F1F` · Ochre `#C9A227`
- Display: Libre Baskerville · UI: DM Sans

## Repo note

This folder lives beside the Ace static site. Do not move or rewrite the existing HTML/CSS/JS admin or student web pages when changing the mobile app.
