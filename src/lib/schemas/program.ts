import { z } from "zod";

export const ExerciseSchema = z.object({
  // Base exercise details (used for upserting into the Exercise library)
  name: z.string(),
  muscleGroup: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  demoVideoUrl: z.string().url().optional().nullable(),

  // Prescription details
  orderIndex: z.number().int(),
  warmupSets: z.number().int().default(0),
  workingSets: z.number().int().default(0),
  targetReps: z.string().optional().nullable(),
  percent1rm: z.number().optional().nullable(),
  targetRpe: z.number().optional().nullable(),
  restSeconds: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
  circuitGroup: z.string().optional().nullable(),
});

export const WorkoutSchema = z.object({
  dayNumber: z.number().int(),
  label: z.string(),
  exercises: z.array(ExerciseSchema),
});

export const WeekSchema = z.object({
  weekNumber: z.number().int(),
  type: z.string(),
  workouts: z.array(WorkoutSchema),
});

export const ProgramSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  totalWeeks: z.number().int(),
  daysPerWeek: z.number().int(),
  weeks: z.array(WeekSchema),
});

export type ProgramInput = z.infer<typeof ProgramSchema>;
export type WeekInput = z.infer<typeof WeekSchema>;
export type WorkoutInput = z.infer<typeof WorkoutSchema>;
export type ExerciseInput = z.infer<typeof ExerciseSchema>;
