# Docket

Android-first Expo app for UMAT study resources — **by Mr. Yeboah**.

Student-facing companion to the Ace static site in this repo. Admin uploads stay on the web; this app is browse → preview → download / learn offline.

## Stack

- Expo SDK 58 + **Expo Router** (TypeScript)
- Theme: Ace cream / forest / ochre (`constants/theme.ts`)
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

### Real Supabase OTP

1. Enable Phone provider in the Supabase project.
2. Put Project URL + anon key in `.env`.
3. Restart Expo (`npx expo start -c`).

## Brand

- Paper `#F3F0E6` · Forest `#1F4A36` · Ochre `#C9A227`
- Display: Libre Baskerville · UI: DM Sans

## Repo note

This folder lives beside the Ace static site. Do not move or rewrite the existing HTML/CSS/JS admin or student web pages when changing the mobile app.
