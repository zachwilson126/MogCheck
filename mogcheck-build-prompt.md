# MogCheck - Full Build Prompt for Coding Agent

## Project Overview

Build **MogCheck**, an iOS mobile app that rates users' facial attractiveness on a 1-10 scale using real mathematical facial ratio analysis (golden ratio, symmetry, facial thirds). The app targets Gen Z / Gen Alpha looksmaxxing culture with funny, sarcastic, slightly rude commentary. Think of it as a legitimate facial analysis tool wrapped in internet brain rot humor.

**This is a React Native + Expo + TypeScript project built in Google Antigravity IDE. Target: iOS App Store release.**

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | React Native + Expo SDK 52+ | Cross-platform, TypeScript support, fast iteration, managed App Store builds via EAS |
| **Language** | TypeScript (strict mode) | Type safety, better DX |
| **IDE** | Google Antigravity | Agent-driven development, VS Code fork |
| **Face Detection** | `react-native-vision-camera` + `react-native-vision-camera-face-detector` (MLKit) | On-device, real-time face landmark detection with contours. Returns 133 face contour points + landmark positions |
| **Face Landmarks (Detailed)** | `react-native-mediapipe` (Face Landmarker) | 468 facial landmark points for precise ratio calculations. Runs on-device via MediaPipe |
| **UI Framework** | React Native Paper + custom components | Material Design 3, dark theme support |
| **Animations** | `react-native-reanimated` v3 + Lottie | Smooth transitions, score reveals, scan animations |
| **Navigation** | Expo Router (file-based) | Simple, modern navigation |
| **State Management** | Zustand | Lightweight, no boilerplate |
| **Roast Text Generation** | Anthropic Claude API (claude-sonnet-4-5-20250929) | Generates personalized funny/sarcastic commentary based on analysis results |
| **Image Transformation** | Stability AI API (stable-diffusion-xl or img2img endpoint) | "Glow up" feature that transforms user photo up the attractiveness scale |
| **In-App Purchases** | `expo-in-app-purchases` or `react-native-iap` | Coin packs for premium features (roast text, transformations, mog battles) |
| **Local Storage** | `expo-secure-store` + AsyncStorage | Secure token storage, scan history |
| **Image Processing** | `expo-image-manipulator` | Crop, resize, compress photos before analysis |
| **Camera** | `react-native-vision-camera` v4 | High-performance camera with frame processor support |
| **Backend (minimal)** | Supabase (auth + edge functions) | User accounts, leaderboards, coin balance, API key proxy |
| **Analytics** | PostHog React Native SDK | Usage tracking, funnel analysis |
| **App Store Build** | EAS Build + EAS Submit | Managed native builds and App Store submission |

---

## Architecture

```
mogcheck/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout (theme, providers)
│   ├── index.tsx                 # Home / landing screen
│   ├── scan.tsx                  # Camera + face scanning
│   ├── results/
│   │   ├── [id].tsx              # Individual scan results
│   │   └── compare.tsx           # Mog Battle comparison
│   ├── history.tsx               # Past scans
│   ├── store.tsx                 # Coin pack purchases
│   ├── leaderboard.tsx           # Global/friends leaderboard
│   └── settings.tsx              # Account, preferences
├── components/
│   ├── camera/
│   │   ├── FaceScanner.tsx       # Camera view with face overlay
│   │   ├── FaceGuide.tsx         # Oval guide for face alignment
│   │   └── ScanAnimation.tsx     # Scanning visual effects
│   ├── results/
│   │   ├── ScoreReveal.tsx       # Animated score reveal (dramatic)
│   │   ├── RatioBreakdown.tsx    # Individual ratio scores with visuals
│   │   ├── TierBadge.tsx         # Chud/NPC/Mid/Chadlite/Chad/Gigachad badge
│   │   ├── RoastCard.tsx         # AI-generated roast text
│   │   └── TransformPreview.tsx  # Before/after transformation
│   ├── battle/
│   │   ├── MogBattle.tsx         # Side-by-side comparison
│   │   └── BattleResult.tsx      # Winner reveal animation
│   ├── store/
│   │   ├── CoinBalance.tsx       # Current coin display
│   │   └── CoinPack.tsx          # Purchase option card
│   └── shared/
│       ├── GlowButton.tsx        # Styled primary button
│       ├── ProgressRing.tsx      # Circular progress
│       └── DisclaimerBanner.tsx  # Legal disclaimer component
├── lib/
│   ├── analysis/
│   │   ├── ratioCalculator.ts    # Core facial ratio math
│   │   ├── symmetryAnalyzer.ts   # Left-right symmetry scoring
│   │   ├── facialThirds.ts       # Upper/middle/lower third proportions
│   │   ├── goldenRatio.ts        # Phi (1.618) comparison engine
│   │   ├── landmarkMapper.ts     # Maps raw landmarks to named points
│   │   └── scoreEngine.ts        # Combines all scores into 1-10 rating
│   ├── api/
│   │   ├── claude.ts             # Roast text generation
│   │   ├── stability.ts          # Image transformation
│   │   └── supabase.ts           # Auth, leaderboard, coins
│   ├── store/
│   │   ├── useUserStore.ts       # Zustand: user state, coins, history
│   │   └── useScanStore.ts       # Zustand: current scan state
│   ├── constants/
│   │   ├── tiers.ts              # Tier definitions and thresholds
│   │   ├── ratios.ts             # Golden ratio targets and weights
│   │   └── roastPrompts.ts       # System prompts for Claude roast gen
│   └── utils/
│       ├── imageUtils.ts         # Photo processing helpers
│       └── formatters.ts         # Score display formatting
├── assets/
│   ├── animations/               # Lottie files (scan, reveal, confetti)
│   ├── images/                   # Tier badge images, icons
│   └── fonts/                    # Custom fonts
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
└── supabase/
    ├── migrations/               # DB schema
    └── functions/
        ├── generate-roast/       # Proxies Claude API (hides API key)
        └── generate-transform/   # Proxies Stability AI API
```

---

## Core Feature Specifications

### 1. Face Scanning & Analysis (FREE - unlimited)

**Camera Screen:**
- Front-facing camera with oval face guide overlay
- Real-time face detection feedback ("Move closer", "Hold still", "Good lighting")
- Face must be detected within the guide oval for 2 seconds before capture
- Animated "scanning" effect plays during analysis (fake loading for drama, 3-5 seconds)
- Haptic feedback on capture

**Facial Ratio Analysis Engine (`lib/analysis/`):**

Using MediaPipe's 468 facial landmarks OR MLKit's contour points, calculate the following ratios. Each ratio is compared against the golden ratio (φ = 1.618) or ideal proportions. Deviation from ideal = lower score for that metric.

**Primary Ratios (heavily weighted):**

| Ratio | Measurement | Ideal | Weight |
|-------|------------|-------|--------|
| Face Length:Width | Hairline-to-chin ÷ bizygomatic width | 1.618 (φ) | 15% |
| Facial Thirds | Upper (hairline-brow) : Middle (brow-nose base) : Lower (nose base-chin) | 1:1:1 (equal) | 15% |
| Eye Spacing | Inter-pupillary distance ÷ face width | 0.44-0.46 | 10% |
| Nose Width:Mouth Width | Alar width ÷ mouth width | 0.618 (1/φ) | 8% |
| Jaw Width:Face Width | Gonial width ÷ bizygomatic width | 0.75-0.80 | 10% |
| Lower Face:Midface | Nose base-to-chin ÷ brow-to-nose base | 0.95-1.05 | 8% |

**Secondary Ratios:**

| Ratio | Measurement | Ideal | Weight |
|-------|------------|-------|--------|
| Eye Width:Face Width | Palpebral fissure ÷ face width | 0.23-0.26 | 5% |
| Lip Ratio | Upper lip height ÷ lower lip height | 0.618 (1/φ) | 5% |
| Nose Length:Face Length | Nasion-to-subnasale ÷ trichion-to-menton | 0.30-0.33 | 5% |
| Chin:Lower Face | Labiale inferius-to-menton ÷ subnasale-to-menton | 0.45-0.50 | 4% |

**Symmetry Score (15% of total):**
- Mirror left/right landmarks across the facial midline
- Calculate deviation for each paired point (left eye vs right eye, left mouth corner vs right, etc.)
- Aggregate into single symmetry percentage (100% = perfect symmetry)
- Apply as 15% weight to overall score

**Scoring Algorithm:**
```typescript
// For each ratio:
const deviation = Math.abs(measuredRatio - idealRatio) / idealRatio;
const ratioScore = Math.max(0, 1 - (deviation * penaltyMultiplier));

// penaltyMultiplier calibrated so:
// 0-5% deviation = 9-10 score range
// 5-15% deviation = 7-8 score range
// 15-25% deviation = 5-6 score range
// 25-40% deviation = 3-4 score range
// 40%+ deviation = 1-2 score range

// Weighted total:
const totalScore = ratios.reduce((sum, r) => sum + (r.score * r.weight), 0);
const finalScore = Math.round(totalScore * 10); // 1-10 scale
```

**Score must be slightly brutal.** Calibrate so the average person scores 5-6, not 7-8. Nobody should feel like the app is being generous. An 8+ should be genuinely hard to achieve. This is what makes it shareable ("bro I got a 4.7 lmao").

### 2. Tier System

| Score Range | Tier | Color | Vibe |
|-------------|------|-------|------|
| 1.0 - 2.4 | **CHUD** | Dark red | Brutal. Needs divine intervention. |
| 2.5 - 3.9 | **NPC** | Gray | Background character energy. Forgettable. |
| 4.0 - 5.4 | **MID** | Yellow | Aggressively average. Could go either way. |
| 5.5 - 6.9 | **CHADLITE** | Light blue | Potential detected. Almost there. |
| 7.0 - 8.4 | **CHAD** | Gold | Strong genetics. The blueprint. |
| 8.5 - 10.0 | **GIGACHAD** | Purple/holographic | Mathematically elite. Walking golden ratio. |

**Results Screen:**
- Dramatic score reveal animation (number counting up with sound effects)
- Large tier badge with glow effect
- Radar chart showing individual ratio scores
- Symmetry percentage with visual overlay
- "Your strongest feature" and "Your weakest feature" callouts
- Share button (generates shareable card with score + tier, no photo for privacy)
- "Get Roasted" button (costs 1 coin) → generates Claude roast
- "Glow Up" button (costs 5 coins) → AI transformation

### 3. AI Roast Text (PREMIUM - 1 coin per roast)

**Claude API Integration:**

The roast is generated by sending the analysis results (NOT the photo) to Claude via a Supabase Edge Function that proxies the API call (keeps API key server-side, user pays via coins).

**System Prompt for Claude Roast:**

```
You are MogCheck's roast engine. You receive facial analysis data and generate a short, funny, sarcastic rating commentary. Your tone is:

- Brutally honest but ultimately good-natured (like a friend who roasts you)
- Uses Gen Z / internet slang naturally (mog, mogged, chud, gigachad, NPC, mid, ratio, no cap, lowkey, it's giving, fr fr, ong, bruh)
- References looksmaxxing culture (mewing, bonesmashing, canthal tilt, hunter eyes, jaw gains)
- Short: 3-5 sentences max
- Should reference their SPECIFIC weak/strong ratios (e.g., "That jaw-to-face ratio is giving Habsburg dynasty")
- Never cruel about things people can't change. Roast the numbers, not the person.
- Include one genuinely helpful (but still funny) improvement suggestion
- End with something encouraging wrapped in humor

IMPORTANT: This is entertainment. Never reference race, ethnicity, gender identity, disability, or anything that could be discriminatory. Keep it about facial geometry and proportions only.

Score tiers determine roast intensity:
- CHUD (1-2.4): Maximum brain rot energy. "Brother needs to start mewing YESTERDAY."
- NPC (2.5-3.9): Sympathetic but honest. "You're one jawline exercise away from having a jawline."
- MID (4.0-5.4): The sweet spot for humor. "Perfectly balanced, as all mid things should be."
- CHADLITE (5.5-6.9): Encouraging with edge. "You're literally one tier away. The grind doesn't stop."
- CHAD (7.0-8.4): Respectful with slight jealousy. "Okay we see you. The golden ratio chose violence today."
- GIGACHAD (8.5-10): Pure reverence. "I'm not even rating you, I'm studying you."
```

**Input to Claude (per request):**
```json
{
  "score": 5.7,
  "tier": "CHADLITE",
  "strongestRatio": { "name": "Eye Spacing", "score": 8.9 },
  "weakestRatio": { "name": "Jaw Width", "score": 4.2 },
  "symmetryScore": 82,
  "facialThirds": { "upper": 31, "middle": 35, "lower": 34 },
  "topRatios": [...],
  "bottomRatios": [...]
}
```

### 4. Mog Battle (FREE to scan, 1 coin per AI verdict)

**How it works:**
1. User A scans their face → gets results
2. User A taps "Mog Battle" → app generates a shareable battle link/QR code
3. User B opens link → scans their face
4. Both results shown side-by-side with category-by-category comparison
5. Winner declared per category + overall winner
6. "AI Verdict" button (1 coin) → Claude generates a funny battle commentary

**Battle Results Screen:**
- Split screen: User A left, User B right
- Each ratio compared with green (winner) / red (loser) indicators
- Overall score comparison with "MOGGED" or "MOGGING" stamp on the loser/winner
- Shareable battle card (scores only, no photos)

**Viral mechanic:** The battle link creates network effects. Person sends to friend, friend downloads app to participate, friend sends to their friend. This is the primary growth engine.

### 5. AI Glow Up / Transformation (PREMIUM - 5 coins)

**Stability AI Integration:**

Uses img2img or SDXL inpainting to transform the user's selfie up the attractiveness scale. The transformation enhances the specific weak ratios identified in their analysis.

**How it works:**
1. User taps "Glow Up" on results screen
2. App sends photo + analysis data to Supabase Edge Function
3. Edge Function calls Stability AI with targeted prompt:
   - If weak jaw → prompt includes "strong defined jawline"
   - If weak symmetry → prompt emphasizes "symmetrical facial features"
   - If weak facial thirds → prompt adjusts proportions
4. Returns transformed image alongside original
5. Slider to compare before/after
6. "Your Potential" label on the transformed version

**Prompt template:**
```
Professional headshot photo of the same person with enhanced facial proportions. 
[DYNAMIC: based on weak ratios]
Maintain the person's identity, skin tone, hair color, and ethnicity.
Only enhance: [specific features identified as weak].
Photorealistic, high quality, natural lighting, front-facing.
```

**CRITICAL: Include disclaimer on every transformation result:**
"This is an AI-generated image for entertainment purposes only. MogCheck does not provide medical, surgical, or cosmetic advice. Results are fictional representations and should not be used to make decisions about cosmetic procedures."

### 6. Premium Improvement Tips (PREMIUM - 2 coins)

After receiving their score, users can pay for a detailed "Ascension Plan" that gives tongue-in-cheek but actually helpful advice:

**Categories:**
- **Mewing & Jaw**: Tongue posture, jaw exercises (with disclaimer these are NOT medical advice)
- **Skin**: Basic skincare routine suggestions (cleanser, moisturizer, SPF)
- **Hair**: Hairstyle suggestions based on face shape ratios
- **Fitness**: General fitness advice (posture, neck training, body composition)
- **Style**: Grooming suggestions

**Generated via Claude with this framing:**
```
Generate a personalized "Ascension Plan" for someone with these facial analysis results.
The tone is looksmaxxing culture but the advice should be ACTUALLY HELPFUL and SAFE.

CRITICAL RULES:
- NEVER suggest surgery, injections, fillers, or any medical procedure
- NEVER suggest bonesmashing, face pulling, or any dangerous practice
- NEVER suggest specific supplements, peptides, or pharmaceuticals
- Focus on: skincare, grooming, hairstyle, posture, fitness, style
- Be funny but genuinely useful
- Frame everything as "optimization" not "fixing"
```

### 7. Coin Store (In-App Purchases)

| Pack | Coins | Price | Best For |
|------|-------|-------|----------|
| **Starter** | 5 coins | $0.99 | One roast + one scan |
| **Grinder** | 25 coins | $3.99 | Regular use |
| **Chad Pack** | 60 coins | $7.99 | Best value |
| **Gigachad Bundle** | 150 coins | $14.99 | Power user |

**Coin costs per feature:**
- Face scan + basic results: FREE (unlimited)
- AI Roast text: 1 coin
- Mog Battle AI verdict: 1 coin
- Ascension Plan (improvement tips): 2 coins
- AI Glow Up transformation: 5 coins

**First-time user gets 3 free coins** to try premium features.

### Gift Packs (User-to-User Gifting)

Apple App Store policy explicitly allows gifting of in-app purchase items (updated guideline: "Apps may enable gifting of items that are eligible for in-app purchase to others. Such gifts may only be refunded to the original purchaser and may not be exchanged.").

**Gift Coin Packs (separate IAP products):**

| Pack | Coins | Price | Label |
|------|-------|-------|-------|
| **Gift - Starter** | 5 coins | $0.99 | "You're mid but I care" |
| **Gift - Grinder** | 25 coins | $3.99 | "Ascend, king" |
| **Gift - Chad Pack** | 60 coins | $7.99 | "Gigachad energy transfer" |

**Gift Flow:**
1. User taps "Gift Coins" in the Store screen
2. Selects a gift pack
3. Enters recipient's username OR shares a gift link
4. Completes IAP purchase (Apple handles payment)
5. Recipient gets a push notification: "Someone thinks you need a glow up. You received 25 MogCoins!"
6. Coins credited to recipient's Supabase balance
7. Gift history logged in `coin_transactions` table with `type: 'gift_sent'` / `'gift_received'`

**Gift Link Flow (for non-users):**
- If recipient doesn't have the app, the gift link opens App Store → they install → create account → coins auto-credited on first login via deep link parameter
- This is a secondary growth mechanic alongside Mog Battles

**Rules (per Apple policy):**
- Refunds only go to the original purchaser, never the recipient
- Coins cannot be exchanged, sold, or converted to real currency
- No secondary marketplace or trading between users
- Gift coins are identical to purchased coins (same utility, no restrictions)

**Supabase Schema Addition:**
```sql
-- Gift tracking
create table gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id),
  recipient_id uuid references profiles(id),
  recipient_username text, -- if sent by username
  gift_link text unique, -- if sent by link
  coin_amount integer not null,
  iap_product_id text not null, -- Apple IAP product ID
  status text default 'pending', -- pending, claimed, expired
  claimed_at timestamptz,
  created_at timestamptz default now()
);

-- RLS: senders see their sent gifts, recipients see received
create policy "Users see own gifts" on gifts for select 
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
```

**UI Notes:**
- Gift button prominently placed in Store screen with a fun icon (wrapped present or crown)
- Each gift pack has a funny tagline (shown above)
- Gift confirmation screen shows a shareable message: "I just gifted you MogCoins on MogCheck. Time for your glow up. 👑" (auto-generated, user can customize)
- Received gifts show in a notification feed with sender's username

---

## UI/UX Design Direction

### Visual Identity
- **Theme:** Dark mode primary. Black/very dark gray backgrounds.
- **Accent colors:** Neon green (#39FF14) for primary actions, tier colors for results
- **Typography:** Bold, condensed display font for scores and tier names (e.g., Bebas Neue or similar). Clean sans-serif for body (e.g., Plus Jakarta Sans or Outfit).
- **Aesthetic:** Cyberpunk meets gym bro. Think Twitch/Discord energy. Scan lines, glow effects, subtle noise texture on backgrounds.
- **Animations:** Dramatic. Score reveals should feel like a slot machine. Tier badge should glow and pulse. Battle results should have impact animations.

### Key Screens

**Home Screen:**
- Large "SCAN YOUR FACE" button with pulsing glow animation
- "MOG BATTLE" button underneath
- Coin balance in top right
- Recent scan history scrollable at bottom
- Clean, minimal, action-oriented

**Scan Screen:**
- Full-screen front camera
- Oval face guide with animated border (turns green when face detected properly)
- Real-time feedback text at top
- Subtle scan line animation when processing
- Dark overlay outside the oval

**Results Screen:**
- Score number animates counting up (e.g., 0.0 → 5.7)
- Tier badge drops in with bounce animation
- Radar/spider chart for individual ratios
- Scrollable detail cards for each ratio
- Action buttons at bottom: "Get Roasted", "Glow Up", "Mog Battle", "Share"

**Battle Screen:**
- VS screen with lightning bolt divider
- Both scores revealed simultaneously
- Category-by-category comparison list
- "MOGGED" stamp animation on loser side
- Confetti on winner side

---

## Legal & Safety Requirements

### App-Wide Disclaimers

**On first launch (mandatory acceptance before using app):**
```
MogCheck is an entertainment app that analyzes facial proportions using mathematical ratios. 

IMPORTANT:
• This app is for ENTERTAINMENT PURPOSES ONLY
• Scores and ratings are based on mathematical ratios and do not represent actual attractiveness or human value
• We do NOT provide medical, surgical, cosmetic, or health advice
• Never make medical or cosmetic decisions based on this app's output
• AI-generated "improvement" suggestions are for entertainment only
• AI-generated image transformations are fictional and do not represent achievable results
• Beauty is subjective and cannot be reduced to mathematical formulas
• If you are experiencing body image issues, please consult a mental health professional

By using MogCheck, you acknowledge this is entertainment and agree to our Terms of Service.

[I Understand & Agree]
```

**On every AI Glow Up result:**
"AI-generated image. For entertainment only. Does not represent achievable results. MogCheck does not provide cosmetic or medical advice."

**On every Ascension Plan:**
"Entertainment only. Not medical advice. Consult a professional before making changes to your health, fitness, or grooming routine."

**In Settings / About:**
- Link to full Terms of Service
- Link to Privacy Policy
- Link to mental health resources (988 Suicide & Crisis Lifeline, Crisis Text Line)
- "Body image concerns?" section with resources

### App Store Requirements

- **Age Rating:** 17+ (Mature/Suggestive Themes)
- **Content Descriptions:** Infrequent/Mild Mature/Suggestive Themes
- **Privacy Nutrition Label:**
  - Camera: Used for face scanning (on-device only)
  - Photos (optional): User can upload existing photos
  - Analytics: PostHog anonymized usage data
  - Purchases: In-app purchase history
- Face photos are processed ON-DEVICE only. Photos sent for AI transformation go through Supabase Edge Function and are NOT stored after processing.
- No photo is ever stored on any server unless the user explicitly opts into leaderboard (which uses score only, not photo).

---

## API Key Security

**CRITICAL: Never expose API keys in the client app.**

All API calls to Claude and Stability AI go through Supabase Edge Functions:
1. User taps "Get Roasted" → app sends analysis JSON + auth token to Supabase Edge Function
2. Edge Function verifies auth, checks coin balance, deducts coin
3. Edge Function calls Claude API with server-side API key
4. Returns roast text to client
5. Same pattern for Stability AI transformations

```
Client → Supabase Edge Function (auth + coin check) → Claude/Stability API → Client
```

User's coin balance lives in Supabase database. All premium feature access is gated server-side, not client-side.

---

## Development Phases

### Phase 1: Core Scan (Weekend Sprint - Days 1-2)
- [ ] Expo project setup with TypeScript
- [ ] Camera screen with face detection overlay
- [ ] Face landmark extraction (MediaPipe or MLKit)
- [ ] Ratio calculation engine (all ratios from spec above)
- [ ] Score algorithm with proper calibration
- [ ] Results screen with score, tier, and ratio breakdown
- [ ] Basic UI with dark theme
- [ ] Share card generation (score + tier, no photo)

### Phase 2: Premium Features (Days 3-4)
- [ ] Supabase setup (auth, database, edge functions)
- [ ] Claude roast text integration via edge function
- [ ] Coin system (local + server state)
- [ ] In-app purchases (coin packs)
- [ ] Ascension Plan generation
- [ ] Scan history (local storage)

### Phase 3: Social & Viral (Days 5-6)
- [ ] Mog Battle flow (link sharing, comparison)
- [ ] Battle results screen with animations
- [ ] Leaderboard (opt-in, score only)
- [ ] Polish animations (score reveal, battle results)
- [ ] Deep linking for battle invites

### Phase 4: AI Transformation & Polish (Days 7-8)
- [ ] Stability AI glow up integration
- [ ] Before/after slider comparison
- [ ] All disclaimer screens and legal copy
- [ ] App Store screenshots and metadata
- [ ] Performance optimization
- [ ] EAS Build for iOS
- [ ] TestFlight submission
- [ ] App Store submission

---

## Environment Variables (`.env`)

```
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# These are SERVER-SIDE ONLY (in Supabase Edge Functions, NOT in client)
# ANTHROPIC_API_KEY=sk-ant-...
# STABILITY_API_KEY=sk-...

# PostHog
EXPO_PUBLIC_POSTHOG_KEY=phc_...

# App Config
EXPO_PUBLIC_FREE_COINS_ON_SIGNUP=3
```

---

## Key Implementation Notes

1. **Face detection fallback:** If MediaPipe face landmarks fail (poor lighting, angle), fall back to MLKit which is more forgiving. If both fail, show user-friendly guidance ("Better lighting needed", "Face the camera directly").

2. **Score calibration is everything.** Spend time testing on diverse faces. The average score MUST be around 5-5.5 for the app to feel honest. If everyone gets a 7+, nobody shares it. The brutality is the product.

3. **Roast text caching:** If a user has the same score ± 0.2 and same tier, you can cache and reuse roast texts to save API costs. But vary them enough that repeat scans feel fresh.

4. **Image transformation quality:** Stability AI img2img can be inconsistent. Set strength parameter to 0.3-0.5 so the transformation enhances features without making it look like a different person. If the result doesn't look like the same person, it kills the magic.

5. **The Mog Battle is the growth engine.** Make the share/invite flow as frictionless as possible. Deep links should open directly to the battle screen. The fewer taps between "my friend sent me this" and "I'm scanning my face," the better.

6. **Don't make it feel like a scam.** The free tier (unlimited scans + results) must feel complete and valuable on its own. Premium features are genuine upgrades, not paywalled basics. This builds trust and reviews.

7. **Diverse testing:** Test the ratio algorithm on faces of different ethnicities, ages, and genders. Golden ratio analysis should work across all demographics. If you notice bias, adjust weights. The app should be equally brutal to everyone.

8. **Performance:** Face landmark detection must be smooth. Target 30fps on iPhone 12+. If frame processing drops below 20fps, reduce detection frequency.

---

## Supabase Schema

```sql
-- Users table (extends Supabase auth)
create table profiles (
  id uuid references auth.users primary key,
  username text unique,
  coins integer default 3, -- free starter coins
  total_scans integer default 0,
  highest_score numeric(3,1) default 0,
  current_tier text,
  created_at timestamptz default now()
);

-- Scan history
create table scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  score numeric(3,1) not null,
  tier text not null,
  symmetry_score integer,
  ratio_data jsonb, -- all individual ratio scores
  roast_text text, -- cached if generated
  created_at timestamptz default now()
);

-- Mog Battles
create table battles (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid references profiles(id),
  challenger_scan_id uuid references scans(id),
  opponent_id uuid references profiles(id),
  opponent_scan_id uuid references scans(id),
  winner_id uuid references profiles(id),
  battle_link text unique,
  status text default 'pending', -- pending, completed
  created_at timestamptz default now()
);

-- Coin transactions
create table coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  amount integer not null, -- positive = purchase, negative = spend
  type text not null, -- 'purchase', 'roast', 'battle', 'transform', 'ascension', 'signup_bonus'
  reference_id uuid, -- scan_id or battle_id
  created_at timestamptz default now()
);

-- Leaderboard (opt-in only)
create table leaderboard (
  user_id uuid references profiles(id) primary key,
  username text not null,
  highest_score numeric(3,1) not null,
  tier text not null,
  opted_in boolean default false,
  updated_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table scans enable row level security;
alter table battles enable row level security;
alter table coin_transactions enable row level security;

-- Users can only read/update their own profile
create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- Users can only see their own scans
create policy "Users read own scans" on scans for select using (auth.uid() = user_id);
create policy "Users insert own scans" on scans for insert with check (auth.uid() = user_id);

-- Leaderboard is public read if opted in
create policy "Public leaderboard" on leaderboard for select using (opted_in = true);
```

---

## App Store Metadata

**App Name:** MogCheck

**Subtitle:** Face Rating & Mog Battles

**Category:** Entertainment

**Age Rating:** 17+

**Keywords:** face rating, looksmaxxing, face analysis, golden ratio, face symmetry, mog, chad, attractiveness, face score, beauty score

**Description:**
```
Think your face is golden ratio certified? MogCheck uses real mathematical facial analysis to rate your facial proportions on a 1-10 scale. Then it roasts you about it.

SCAN YOUR FACE
• Instant facial ratio analysis using golden ratio mathematics
• Symmetry scoring, facial thirds breakdown, and 10+ proportion measurements
• Tier ranking: Chud → NPC → Mid → Chadlite → Chad → Gigachad

GET ROASTED
• AI-generated personalized commentary based on YOUR specific ratios
• Brutally honest. Occasionally encouraging. Always hilarious.

MOG BATTLE
• Challenge friends to a head-to-head face-off
• Category-by-category comparison
• Find out who mogs who (the numbers don't lie)

AI GLOW UP
• See your "potential" with AI-enhanced transformation
• Based on your actual weak ratios, not random filters

ASCENSION PLAN
• Personalized (and actually helpful) improvement tips
• Grooming, skincare, hairstyle, and fitness suggestions

MogCheck is for ENTERTAINMENT ONLY. Scores are based on mathematical proportions and do not represent actual attractiveness or human value. Beauty is subjective. Touch grass.
```

**Privacy URL:** [your privacy policy URL]
**Support URL:** [your support URL]

---

## Final Notes for the Coding Agent

1. Start with Phase 1. Get the camera + face detection + ratio math + results screen working FIRST. Everything else builds on top of a working scan.

2. Use Expo's development build (`npx expo run:ios`) for testing camera and native features. Expo Go won't work for vision-camera.

3. The ratio calculation engine is the heart of the app. Get this right first, test it thoroughly, then build the UI around it.

4. For the initial build, hardcode some funny roast texts by tier as placeholders before integrating Claude API. This lets you test the full user flow without API dependencies.

5. The app should work completely offline for the free tier (scan + results). Premium features require internet for API calls.

6. Have fun with this. The app should feel like it was built by someone who's in on the joke. Not corporate. Not sterile. Brain rot energy with real math underneath.
