# JP Powerbuilding Tracker — Design Spec

## Overview

A mobile-first web app that guides users through Jeff Nippard's Powerbuilding System (4x/week, 10-week cycle). Unlike generic trackers like Hevy, this app understands the program's periodization, auto-calculates all weights from user 1RMs, and provides a guided workout experience that requires minimal input mid-session.

**Target users:** Intermediate-advanced lifters running the Nippard Powerbuilding program, starting with the builder and training partners.

**Benchmark:** Hevy — match its logging speed and polish, but differentiate with program intelligence (auto %1RM calculation, alternating week awareness, RPE guidance, structured progression).

## Tech Stack

- **Frontend:** Next.js (App Router), TanStack Query, Tailwind CSS
- **Backend/DB:** Next.js Server Actions, Prisma ORM, Supabase (Postgres)
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Deployment:** Vercel (assumed, natural fit for Next.js)

No PWA or offline support in V1. Responsive web app, mobile-first design.

## Core Data Model

### Users & Auth

- Supabase Auth handles sign-up/login
- `profiles` table: display_name, unit_preference (kg/lb), body_weight (optional)

### Program Structure

- `programs` — defines a program template (name, description, total_weeks, days_per_week)
- `program_weeks` — week number, type (full_body | upper_lower), belongs to a program
- `program_workouts` — day number, label (e.g., "Full Body 1: Squat, OHP"), belongs to a week
- `program_exercises` — ordered list per workout: exercise_id, warmup_sets, working_sets, target_reps, percent_1rm (nullable), target_rpe (nullable), rest_seconds, notes/cues, circuit_group (nullable, e.g., "A1", "A2")

### Exercise Library

- `exercises` — name, muscle_group, category (primary | secondary | tertiary), demo_video_url (nullable)

### User Cycles

- `cycles` — user_id, program_id, start_date, squat_1rm, bench_1rm, deadlift_1rm, current_week, status (active | completed)
- A user can have multiple cycles over time (re-run with updated 1RMs)

### Workout Logs

- `workout_logs` — user_id, cycle_id, program_workout_id, started_at, completed_at, duration_seconds, session_rpe (nullable)
- `set_logs` — workout_log_id, exercise_id, set_number, set_type (warmup | working), target_weight, actual_weight, target_reps, actual_reps, rpe (nullable), completed_at

### Calculated Fields (derived, not stored)

- Target weight per set = user's 1RM × %1RM from program_exercises
- Estimated 1RM over time (from logged sets, using Epley formula)
- Warm-up pyramid weights (auto-generated from working set target)

## UX Flow

### Onboarding

1. Sign up (email or Google)
2. Enter Big 3 1RMs (squat, bench, deadlift)
3. Choose unit preference (kg/lb)
4. Lands on home screen — Week 1, Day 1 ready to go

### Home Screen

- Current position: "Week 3 / Day 2 — Full Body: Deadlift, Bench Press"
- Primary action: **Start Workout** button
- Below: upcoming workouts this week, recent workout history
- Navigation to progress/analytics

### Pre-Workout View

- Full workout preview — every exercise with target weights pre-filled
- Warm-up pyramid shown for primary exercises
- Coaching cues visible per exercise
- "Let's Go" to begin the session

### Active Workout (Core Loop)

1. Current exercise displayed with coaching cues from the program
2. Warm-up sets shown first (collapsible) with auto-calculated pyramid weights
3. Working sets displayed one at a time — target weight and reps pre-filled
4. **Logging a set:** weight + reps pre-filled from program. User taps "Done" to confirm, or adjusts values first. Big tap targets, one-thumb friendly
5. Rest timer auto-starts after each set (duration from program data)
6. Timer screen shows next set preview
7. Circuit exercises (A1/A2) alternate automatically with shorter rest
8. PR detection — if a set exceeds previous best, celebrate it

### Post-Workout

- Summary card: exercises completed, total volume, PRs hit, workout duration
- Optional session RPE rating
- Save and return to home

### Key UX Principles

- **Zero-input default:** weights are pre-filled, user just confirms. Adjusting is easy but not required
- **One-thumb operation:** bottom-anchored actions, large tap targets, no tiny buttons
- **Minimal navigation:** active workout is one scrollable flow, not nested modals
- **Fast logging:** tap "Done" → rest timer → next set. The happy path is three taps per set

## Progress & Analytics

### Strength Charts (Primary)

- Line chart per Big 3 lift: estimated 1RM over time
- Week-by-week view aligned to program cycle
- PR markers highlighted on charts

### Program Overview (Primary)

- Visual timeline of the 10-week cycle
- Which weeks/days are complete, current position highlighted
- Completion percentage

### Volume Tracking (Secondary)

- Weekly tonnage (sets × reps × weight) per muscle group
- Week-over-week comparison

### Workout History

- Chronological log of all past sessions
- Tap to expand: full set-by-set detail

## Program Data

The Nippard Powerbuilding 4x/week program will be seeded into the database:

- **Weeks 1, 3, 5, 7, 9 (Odd):** Full Body split — 4 workouts (Full Body 1-4)
- **Weeks 2, 4, 6, 8 (Even):** Upper/Lower split — 4 workouts (Lower 1, Upper 1, Lower 2, Upper 2)
- **Week 10:** Max testing week
- **Week 11:** Deload week
- All exercises, sets, reps, %1RM brackets, RPE targets, rest times, and coaching cues from the PDF

Exercises referencing %1RM: squat, bench press, deadlift (and their variations like pause deadlift, pause bench). All other exercises use RPE-only prescription.

## Scope — V1 vs Later

### V1 (This Build)

- Auth (email + Google)
- Onboarding (1RM input, unit preference)
- Full Nippard 4x/week program seeded
- Guided workout flow with auto-calculated weights
- Set logging with optional RPE
- Rest timer
- Warm-up pyramid calculator
- Strength charts (Big 3 estimated 1RM)
- Program overview timeline
- Volume tracking
- Workout history

### Deferred (V2+)

- Social features (friend feed, workout sharing/summary cards)
- PWA / offline support / service worker
- Additional program templates
- Exercise substitution management
- Apple/Google Watch integration
- Export data (CSV/PDF)

## Non-Goals

- This is not a general-purpose workout tracker. V1 is purpose-built for the Nippard Powerbuilding program.
- No nutrition tracking, no cardio tracking, no body measurement tracking.
- No AI coaching or auto-programming.
