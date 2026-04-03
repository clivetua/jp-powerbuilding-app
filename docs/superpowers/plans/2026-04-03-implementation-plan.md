# JP Powerbuilding Tracker — Implementation Plan

**Spec:** [Design Spec](../specs/2026-04-02-jp-powerbuilding-tracker-design.md)
**Date:** 2026-04-03

---

## Phase 1: Project Scaffolding & Database

**Goal:** Next.js project running locally with Supabase connected and all tables created.

### 1.1 — Initialize Next.js Project
- `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS, ESLint
- Initialize `shadcn/ui` (`npx shadcn-ui@latest init`) and add essential components (button, card, sheet, input, form)
- Configure `tailwind.config.ts` with mobile-first breakpoints and custom theme tokens (colors, spacing for gym-friendly tap targets)
- Add TanStack Query provider in root layout
- Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`, `recharts` (for charts later), `@prisma/client` and `prisma` (dev)

### 1.2 — Supabase Project Setup
- Create Supabase project (or use local dev with `supabase init` + `supabase start`)
- Configure environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Create Supabase client utilities (`lib/supabase/client.ts` for browser, `lib/supabase/server.ts` for server components)

### 1.3 — Database Schema & Prisma Setup
- Run `npx prisma init` and configure connection to Supabase Postgres (using connection pooling / Transaction connection string)
- Define schema in `prisma/schema.prisma`:

```prisma
model Profile {
  id           String  @id // FK to auth.users
  displayName  String?
  unitPref     String  @default("kg") // kg or lb
  bodyWeight   Float?
  cycles       Cycle[]
}

model Cycle {
  id           String   @id @default(uuid())
  userId       String
  user         Profile  @relation(fields: [userId], references: [id])
  programId    String
  program      Program  @relation(fields: [programId], references: [id])
  startDate    DateTime @default(now())
  squat1rm     Float?
  bench1rm     Float?
  deadlift1rm  Float?
  currentWeek  Int      @default(1)
  status       String   @default("active") // active | completed
  workoutLogs  WorkoutLog[]
}

// ... other models mapping to the design:
// Program, ProgramWeek, ProgramWorkout, ProgramExercise, Exercise, WorkoutLog, SetLog
```

- Run `npx prisma db push` or `prisma migrate dev` to create the tables in Supabase.

### 1.4 — Data Access & Authorization
- Because we are using Prisma, we will handle authorization at the application level via Next.js Server Actions and API routes.
- Ensure all Prisma queries for user data (cycles, workout logs, profiles) strictly include a `userId` filter matching the authenticated user's ID from Supabase Auth (`supabase.auth.getUser()`).
- (Optional) RLS can still be enabled on Supabase to prevent rogue access, but Prisma will use the connection string with the service role or a dedicated role that bypasses RLS, relying on the Next.js backend for security.

### 1.5 — Seed Data: Nippard Program
- Parse the PDF program data into a seed script (`prisma/seed.ts`)
- All 11 weeks (weeks 1-9 alternating, week 10 max test, week 11 deload)
- Every exercise with: sets, reps, %1RM (where applicable), RPE targets, rest times, coaching cues
- Exercise library entries for all ~40+ exercises in the program

**Exit criteria:** `npx prisma db push` creates all tables, `npx prisma db seed` seeds program data, and data access passes basic tests.

---

## Phase 2: Auth & Onboarding

**Goal:** User can sign up, enter 1RMs, and land on the home screen with their first cycle created.

### 2.1 — Auth Setup
- Configure Supabase Auth: enable email/password + Google OAuth provider
- Create auth middleware (`middleware.ts`) to protect routes — redirect unauthenticated users to `/login`
- Implement Supabase auth helpers using `@supabase/ssr`

### 2.2 — Auth Pages
- `/login` — email + password form, Google OAuth button, link to sign up
- `/signup` — email + password form, Google OAuth button
- Minimal styling — clean, centered card layout. Mobile-first

### 2.3 — Onboarding Flow
- `/onboarding` — shown after first sign-up (if no profile exists)
- Step 1: Enter display name, choose unit (kg/lb)
- Step 2: Enter Big 3 1RMs (squat, bench, deadlift) with unit shown
- On submit: create `profiles` row, create first `cycles` row (Week 1, status: active)
- Redirect to home

**Exit criteria:** New user can sign up → complete onboarding → see home screen. Returning user goes straight to home.

---

## Phase 3: Home Screen & Workout Preview

**Goal:** User sees where they are in the program and can preview today's workout.

### 3.1 — Home Screen (`/`)
- Fetch active cycle + current week/day position
- Display: "Week X / Day Y — [Workout Label]"
- **Start Workout** button (prominent, bottom-anchored on mobile)
- Upcoming workouts list for this week (with completion status)
- Recent workout history (last 3-5 sessions, summary only)

### 3.2 — Pre-Workout View (`/workout/[workoutId]/preview`)
- Fetch program_exercises for this workout
- Calculate target weights from user's 1RMs × %1RM
- Display full exercise list with: name, sets × reps, target weight (or RPE), coaching cues
- Auto-generate warm-up pyramid for primary lifts (bar → 50% → 70% → 85% → working weight, adjustable)
- **Let's Go** button to start the session

### 3.3 — Weight Calculation Utility
- `lib/calculations.ts`:
  - `calculateTargetWeight(oneRepMax, percentage, unit)` — rounds to nearest 2.5kg / 5lb
  - `calculateWarmupPyramid(workingWeight, unit)` — returns array of warm-up set objects
  - `estimateOneRepMax(weight, reps)` — Epley formula: `weight × (1 + reps/30)`
  - `convertUnit(weight, from, to)` — kg ↔ lb

**Exit criteria:** User sees home screen with correct program position, can preview workout with calculated weights.

---

## Phase 4: Active Workout & Set Logging

**Goal:** User can work through a full workout session, logging every set with minimal input.

### 4.1 — Active Workout View (`/workout/[workoutId]/active`)
- Create `workout_logs` row on session start (capture `started_at`)
- Display exercises in program order
- Current exercise highlighted with coaching cues
- Warm-up sets shown (collapsible, auto-calculated)
- Working sets displayed with pre-filled weight + reps

### 4.2 — Set Logging Component
- Per-set card: target weight (editable), target reps (editable), optional RPE input
- **Done** button — large, thumb-friendly, bottom of screen
- On tap: save `set_logs` row, advance to next set
- Optimistic update via TanStack Query — instant UI feedback, sync in background

### 4.3 — Rest Timer
- Auto-starts after completing a set
- Duration from `program_exercises.rest_seconds` (3-4 min compounds, 1-2 min accessories)
- Countdown display with next set preview
- Skip button to move on early
- Subtle vibration/sound on timer complete (if browser supports)

### 4.4 — Circuit Exercise Handling
- Exercises with `circuit_group` (e.g., A1/A2) alternate automatically
- After completing A1 set → short rest → A2 set → short rest → back to A1
- UI indicates circuit pairing clearly

### 4.5 — PR Detection
- After logging a set, compare to previous best for that exercise (highest estimated 1RM or highest weight × reps)
- If new PR: brief celebration animation/indicator
- Store PR detection logic in `lib/calculations.ts`

### 4.6 — Post-Workout Summary
- On session complete: update `workout_logs` with `completed_at`, `duration_seconds`
- Summary screen: exercises completed, total volume (sets × reps × weight), any PRs, duration
- Optional session RPE slider (1-10)
- **Save & Finish** → return to home, advance program position

**Exit criteria:** User can complete an entire workout, all sets logged, rest timer works, PRs detected, summary shown.

---

## Phase 5: Progress & Analytics

**Goal:** User can see strength trends, program progress, and workout history.

### 5.1 — Strength Charts (`/progress`)
- Line chart per Big 3 lift (squat, bench, deadlift)
- X-axis: weeks in program. Y-axis: estimated 1RM
- Calculated from best set each workout using Epley formula
- PR markers shown on chart
- Use `recharts` library — responsive, mobile-friendly

### 5.2 — Program Overview (`/progress/program`)
- Visual timeline of all weeks in the cycle
- Each day shown as a dot/block — completed (filled), upcoming (outline), current (highlighted)
- Completion percentage text
- Tap a completed day to see that workout's summary

### 5.3 — Volume Tracking (`/progress/volume`)
- Weekly tonnage bar chart per muscle group
- Derived from `set_logs` joined with `exercises.muscle_group`
- Week-over-week comparison

### 5.4 — Workout History (`/history`)
- Chronological list of all completed workouts
- Each entry: date, workout label, duration, total volume
- Tap to expand: full set-by-set breakdown

**Exit criteria:** All four analytics views render with real data from completed workouts.

---

## Phase 6: Polish & Deploy

**Goal:** Production-ready, deployed, usable at the gym.

### 6.1 — Mobile UX Polish
- Audit all screens on mobile viewport (375px wide)
- Ensure tap targets ≥ 44px
- Bottom-anchored primary actions on all key screens
- Smooth transitions between workout states
- Loading states and skeletons for data-heavy pages

### 6.2 — Edge Cases & Error Handling
- Handle mid-workout app close (persist state, resume on return)
- Handle cycle completion (Week 11 done → prompt to start new cycle with updated 1RMs)
- Empty states (no workouts yet, no history)
- Network error handling with TanStack Query retry

### 6.3 — Deploy
- Deploy to Vercel (connect GitHub repo)
- Configure Supabase production project
- Set environment variables in Vercel
- Run seed script against production database
- Verify auth flow end-to-end in production

**Exit criteria:** App is live, you can sign up and complete a workout on your phone at the gym.

---

## File Structure (Target)

```
src/
├── app/
│   ├── layout.tsx              # Root layout, providers
│   ├── page.tsx                # Home screen
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── onboarding/page.tsx
│   ├── workout/
│   │   └── [workoutId]/
│   │       ├── preview/page.tsx
│   │       └── active/page.tsx
│   ├── progress/
│   │   ├── page.tsx            # Strength charts
│   │   ├── program/page.tsx
│   │   └── volume/page.tsx
│   └── history/page.tsx
├── components/
│   ├── ui/                     # Shared UI components
│   ├── workout/                # Workout-specific components
│   ├── progress/               # Chart components
│   └── auth/                   # Auth forms
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── calculations.ts         # 1RM, warm-up, unit conversion
│   ├── types.ts                # TypeScript types matching DB schema
│   └── queries.ts              # TanStack Query hooks
├── middleware.ts                # Auth middleware
supabase/
├── config.toml
prisma/
├── schema.prisma               # Prisma schema
└── seed.ts                     # Seed script
```

---

## Execution Order

| Order | Phase | Estimated Effort |
|-------|-------|-----------------|
| 1 | Phase 1: Scaffolding & Database | Foundation — everything depends on this |
| 2 | Phase 2: Auth & Onboarding | Unlocks user-specific data |
| 3 | Phase 3: Home & Preview | First visible screens |
| 4 | Phase 4: Active Workout | Core product value — the gym experience |
| 5 | Phase 5: Progress & Analytics | Builds on workout data |
| 6 | Phase 6: Polish & Deploy | Ship it |

Each phase is independently demoable. Phase 4 is the largest and most critical.
