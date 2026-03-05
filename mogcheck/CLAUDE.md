# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MogCheck is an iOS mobile app that rates facial attractiveness on a 1-10 scale using on-device mathematical facial ratio analysis (golden ratio, symmetry, facial thirds). It targets Gen Z looksmaxxing culture with sarcastic commentary. The full build specification lives in `mogcheck-build-prompt.md`.

## Tech Stack

- **Framework:** React Native + Expo SDK 54 with TypeScript (strict mode)
- **Navigation:** Expo Router v6 (file-based routing in `app/`)
- **State:** Zustand (`useUserStore`, `useScanStore`, `useBattleStore`)
- **UI:** React Native Paper + custom components, `react-native-reanimated` v3, Lottie
- **Camera/Face:** `react-native-vision-camera` v4 + MLKit face detector, `react-native-mediapipe` (468-point Face Landmarker)
- **Backend:** Supabase (auth, edge functions for API proxying, coin balance, leaderboard)
- **AI:** Anthropic Claude API for roast text, Stability AI for image transformation
- **IAP:** `react-native-iap` v14 (Nitro-based)
- **Analytics:** PostHog React Native SDK
- **Build/Deploy:** EAS Build + EAS Submit (iOS only)

## Development Commands

```bash
# Install dependencies
cd mogcheck && npm install

# TypeScript check
npm run typecheck

# Development (must use dev build — Expo Go won't work due to vision-camera)
npm run ios    # or: npx expo run:ios

# Build for App Store
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

**Note:** The Expo project lives in the `mogcheck/` subdirectory.

## Architecture

### Core Data Flow

```
Camera → MLKit (face detection) → MediaPipe (468 landmarks) → ratioCalculator/symmetryAnalyzer/facialThirds → scoreEngine → Results UI
```

All free-tier face analysis runs **entirely on-device** — no server round-trip. Premium features proxy through Supabase Edge Functions to keep API keys off the client:

```
Client → Supabase Edge Function (auth + coin deduction) → Claude/Stability AI → Client
```

### Key Directories

- `app/` — Expo Router pages (scan, results/[id], glowup/[id], battle/[id], history, store, leaderboard, settings)
- `components/` — UI organized by domain: `camera/`, `results/`, `battle/`, `store/`, `shared/`
- `lib/analysis/` — On-device facial math: `landmarkMapper` → `ratioCalculator`, `symmetryAnalyzer`, `facialThirds`, `goldenRatio` → `scoreEngine`
- `lib/api/` — API clients: `supabase.ts` (all server calls including transform/roast/battle), `auth.ts`, `iap.ts`
- `lib/store/` — Zustand stores
- `lib/constants/` — Tier definitions, golden ratio targets/weights, roast system prompts
- `supabase/functions/` — Edge functions: `generate-roast/`, `generate-transform/`, `generate-ascension-plan/`, `generate-battle-verdict/`
- `supabase/migrations/` — Database schema

### Scoring Engine

The scoring algorithm uses weighted facial ratio deviations from ideal values:
```typescript
const deviation = Math.abs(measuredRatio - idealRatio) / idealRatio;
const ratioScore = Math.max(0, 1 - (deviation * penaltyMultiplier));
// Weighted sum → final 1-10 score
```
**Calibration target:** Average person scores 5.0-5.5 (not 7+). Brutality drives shareability.

### Tier System

| Score | Tier | Color |
|-------|------|-------|
| 1.0–2.4 | CHUD | Dark red |
| 2.5–3.9 | NPC | Gray |
| 4.0–5.4 | MID | Yellow |
| 5.5–6.9 | CHADLITE | Light blue |
| 7.0–8.4 | CHAD | Gold |
| 8.5–10.0 | GIGACHAD | Purple/holographic |

### Coin Economy

All premium features are coin-gated, deducted server-side before API calls:
- **1 coin:** AI Roast text, Mog Battle AI verdict
- **2 coins:** Ascension Plan
- **5 coins:** AI Glow Up transformation
- **3 free coins** on signup

### Database (Supabase/Postgres)

Six tables with Row Level Security: `profiles`, `scans`, `battles`, `coin_transactions`, `leaderboard`, `gifts`. See `mogcheck-build-prompt.md` for full schemas. All RLS policies enforce user-scoped access; leaderboard is public-read only where `opted_in = true`.

## Environment Variables

```env
# Client-side (EXPO_PUBLIC_ prefix required)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_FREE_COINS_ON_SIGNUP=3

# Server-side ONLY (Supabase Edge Functions — never in client)
ANTHROPIC_API_KEY=
STABILITY_API_KEY=
```

## Critical Implementation Notes

- **Expo Go won't work** — `react-native-vision-camera` requires a native development build via `npx expo run:ios`
- **MediaPipe fallback:** If `react-native-mediapipe` fails, fall back to MLKit's 133 contour points
- **Photo privacy:** Photos sent for AI transformation are not stored server-side after processing
- **Roast caching:** Cache roast text for same score (within ±0.2) and same tier to reduce API costs
- **Stability AI transform:** Use `strength` param 0.3-0.5 to preserve facial identity
- **Performance:** Target 30fps face detection on iPhone 12+; reduce detection frequency if below 20fps
- **Offline-first free tier:** Free scan + results must work fully offline
- **Mog Battle deep links:** Must open directly to battle screen with minimal friction
- **Legal:** Mandatory disclaimer acceptance on first launch; disclaimers on every AI output; mental health resources in Settings

## Design System

- **Theme:** Dark mode primary, black/very dark gray backgrounds
- **Primary accent:** Neon green `#39FF14`
- **Typography:** Bebas Neue (scores/tiers), Plus Jakarta Sans or Outfit (body text)
- **Aesthetic:** Cyberpunk meets gym bro — scan lines, glow effects, subtle noise texture
- **Animations:** Dramatic reveals (slot machine score, bouncing tier badges, impact battle stamps)
