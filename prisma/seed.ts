import { PrismaClient, Exercise } from '../src/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const exerciseData = [
  // Primary (Big 3)
  { name: 'Squat', muscleGroup: 'Legs', category: 'primary' },
  { name: 'Bench Press', muscleGroup: 'Chest', category: 'primary' },
  { name: 'Deadlift', muscleGroup: 'Back/Legs', category: 'primary' },
  // Secondary
  { name: 'Overhead Press', muscleGroup: 'Shoulders', category: 'secondary' },
  { name: 'Front Squat', muscleGroup: 'Legs', category: 'secondary' },
  { name: 'Incline Bench Press', muscleGroup: 'Chest', category: 'secondary' },
  { name: 'Romanian Deadlift', muscleGroup: 'Legs', category: 'secondary' },
  { name: 'Barbell Row', muscleGroup: 'Back', category: 'secondary' },
  { name: 'Pull Up', muscleGroup: 'Back', category: 'secondary' },
  { name: 'Lat Pulldown', muscleGroup: 'Back', category: 'secondary' },
  { name: 'Leg Press', muscleGroup: 'Legs', category: 'secondary' },
  { name: 'Hack Squat', muscleGroup: 'Legs', category: 'secondary' },
  // Tertiary / Accessories
  { name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', category: 'tertiary' },
  { name: 'Face Pull', muscleGroup: 'Shoulders', category: 'tertiary' },
  { name: 'Bicep Curl', muscleGroup: 'Arms', category: 'tertiary' },
  { name: 'Tricep Extension', muscleGroup: 'Arms', category: 'tertiary' },
  { name: 'Hammer Curl', muscleGroup: 'Arms', category: 'tertiary' },
  { name: 'Skullcrusher', muscleGroup: 'Arms', category: 'tertiary' },
  { name: 'Leg Extension', muscleGroup: 'Legs', category: 'tertiary' },
  { name: 'Leg Curl', muscleGroup: 'Legs', category: 'tertiary' },
  { name: 'Calf Raise', muscleGroup: 'Legs', category: 'tertiary' },
  { name: 'Seated Calf Raise', muscleGroup: 'Legs', category: 'tertiary' },
  { name: 'Cable Crunch', muscleGroup: 'Core', category: 'tertiary' },
  { name: 'Plank', muscleGroup: 'Core', category: 'tertiary' },
  { name: 'Dumbbell Fly', muscleGroup: 'Chest', category: 'tertiary' },
  { name: 'Pec Deck', muscleGroup: 'Chest', category: 'tertiary' },
  { name: 'Dumbbell Row', muscleGroup: 'Back', category: 'tertiary' },
  { name: 'Seated Cable Row', muscleGroup: 'Back', category: 'tertiary' },
  { name: 'Shrug', muscleGroup: 'Shoulders', category: 'tertiary' },
  { name: 'Rear Delt Fly', muscleGroup: 'Shoulders', category: 'tertiary' },
  { name: 'Preacher Curl', muscleGroup: 'Arms', category: 'tertiary' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Arms', category: 'tertiary' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Legs', category: 'tertiary' },
  { name: 'Lunge', muscleGroup: 'Legs', category: 'tertiary' },
  { name: 'Glute Bridge', muscleGroup: 'Legs', category: 'tertiary' },
  { name: 'Hip Thrust', muscleGroup: 'Legs', category: 'tertiary' },
  { name: 'Good Morning', muscleGroup: 'Legs', category: 'tertiary' },
  { name: 'Machine Chest Press', muscleGroup: 'Chest', category: 'tertiary' },
  { name: 'Machine Shoulder Press', muscleGroup: 'Shoulders', category: 'tertiary' },
  { name: 'T-Bar Row', muscleGroup: 'Back', category: 'tertiary' },
]

async function main() {
  console.log('Seeding database...')

  // Clear existing programs and exercises for idempotency
  await prisma.programExercise.deleteMany()
  await prisma.programWorkout.deleteMany()
  await prisma.programWeek.deleteMany()
  await prisma.program.deleteMany()
  await prisma.exercise.deleteMany()

  // 1. Create Exercise Library
  console.log('Creating exercises...')
  const exercises: Exercise[] = []
  for (const data of exerciseData) {
    const ex = await prisma.exercise.create({ data })
    exercises.push(ex)
  }
  const getEx = (name: string) => exercises.find(e => e.name === name)!

  // 2. Create Program
  console.log('Creating program...')
  const program = await prisma.program.create({
    data: {
      name: 'Jeff Nippard Powerbuilding Phase 1',
      description: 'A 10-week powerbuilding program focusing on increasing the SBD while putting on size. Week 11 is a deload.',
      totalWeeks: 11,
      daysPerWeek: 5,
    }
  })

  // 3. Create Week 1
  console.log('Creating Week 1...')
  const week1 = await prisma.programWeek.create({
    data: {
      programId: program.id,
      weekNumber: 1,
      type: 'upper_lower'
    }
  })

  // Week 1 - Day 1: Upper 1
  const w1d1 = await prisma.programWorkout.create({
    data: {
      programWeekId: week1.id,
      dayNumber: 1,
      label: 'Upper Body 1'
    }
  })

  await prisma.programExercise.createMany({
    data: [
      {
        programWorkoutId: w1d1.id,
        exerciseId: getEx('Bench Press').id,
        orderIndex: 0,
        warmupSets: 3,
        workingSets: 3,
        targetReps: '5',
        percent1rm: 75, // 3x5 @ 75%
        targetRpe: 7,
        restSeconds: 180,
        notes: 'Control the eccentric, explosive concentric. Pause on the chest.'
      },
      {
        programWorkoutId: w1d1.id,
        exerciseId: getEx('Barbell Row').id,
        orderIndex: 1,
        warmupSets: 1,
        workingSets: 3,
        targetReps: '8-10',
        targetRpe: 8,
        restSeconds: 120,
        notes: 'Keep back straight, pull to belly button.'
      },
      {
        programWorkoutId: w1d1.id,
        exerciseId: getEx('Overhead Press').id,
        orderIndex: 2,
        warmupSets: 1,
        workingSets: 3,
        targetReps: '8-10',
        targetRpe: 8,
        restSeconds: 120,
        notes: 'Core tight, do not use leg drive.'
      },
      {
        programWorkoutId: w1d1.id,
        exerciseId: getEx('Lat Pulldown').id,
        orderIndex: 3,
        warmupSets: 0,
        workingSets: 3,
        targetReps: '10-12',
        targetRpe: 8,
        restSeconds: 90,
        notes: 'Full stretch at the top, squeeze at the bottom.'
      },
      {
        programWorkoutId: w1d1.id,
        exerciseId: getEx('Dumbbell Lateral Raise').id,
        orderIndex: 4,
        warmupSets: 0,
        workingSets: 3,
        targetReps: '12-15',
        targetRpe: 9,
        restSeconds: 90,
        notes: 'Lead with the elbows, slight forward lean.'
      },
      {
        programWorkoutId: w1d1.id,
        exerciseId: getEx('Tricep Extension').id,
        orderIndex: 5,
        warmupSets: 0,
        workingSets: 3,
        targetReps: '10-12',
        targetRpe: 9,
        restSeconds: 90,
        circuitGroup: 'A'
      },
      {
        programWorkoutId: w1d1.id,
        exerciseId: getEx('Bicep Curl').id,
        orderIndex: 6,
        warmupSets: 0,
        workingSets: 3,
        targetReps: '10-12',
        targetRpe: 9,
        restSeconds: 90,
        circuitGroup: 'A'
      }
    ]
  })

  // Week 1 - Day 2: Lower 1
  const w1d2 = await prisma.programWorkout.create({
    data: {
      programWeekId: week1.id,
      dayNumber: 2,
      label: 'Lower Body 1'
    }
  })

  await prisma.programExercise.createMany({
    data: [
      {
        programWorkoutId: w1d2.id,
        exerciseId: getEx('Squat').id,
        orderIndex: 0,
        warmupSets: 3,
        workingSets: 3,
        targetReps: '5',
        percent1rm: 75,
        targetRpe: 7,
        restSeconds: 180,
        notes: 'Hit depth. Keep chest up.'
      },
      {
        programWorkoutId: w1d2.id,
        exerciseId: getEx('Romanian Deadlift').id,
        orderIndex: 1,
        warmupSets: 1,
        workingSets: 3,
        targetReps: '8-10',
        targetRpe: 8,
        restSeconds: 120,
        notes: 'Hinge at the hips, slight bend in knees.'
      },
      {
        programWorkoutId: w1d2.id,
        exerciseId: getEx('Leg Press').id,
        orderIndex: 2,
        warmupSets: 1,
        workingSets: 3,
        targetReps: '10-12',
        targetRpe: 8,
        restSeconds: 120,
        notes: 'Control the descent, do not lock knees.'
      },
      {
        programWorkoutId: w1d2.id,
        exerciseId: getEx('Leg Curl').id,
        orderIndex: 3,
        warmupSets: 0,
        workingSets: 3,
        targetReps: '12-15',
        targetRpe: 9,
        restSeconds: 90,
        notes: 'Squeeze hamstrings at the top.'
      },
      {
        programWorkoutId: w1d2.id,
        exerciseId: getEx('Calf Raise').id,
        orderIndex: 4,
        warmupSets: 0,
        workingSets: 4,
        targetReps: '12-15',
        targetRpe: 9,
        restSeconds: 90,
        notes: 'Pause at the bottom stretch.'
      }
    ]
  })

  // Note: Add Week 1 - Day 3, 4, 5 here later

  // 4. Create Week 2
  console.log('Creating Week 2...')
  const week2 = await prisma.programWeek.create({
    data: {
      programId: program.id,
      weekNumber: 2,
      type: 'upper_lower'
    }
  })

  // Week 2 - Day 1: Upper 1
  const w2d1 = await prisma.programWorkout.create({
    data: {
      programWeekId: week2.id,
      dayNumber: 1,
      label: 'Upper Body 1'
    }
  })

  await prisma.programExercise.createMany({
    data: [
      {
        programWorkoutId: w2d1.id,
        exerciseId: getEx('Bench Press').id,
        orderIndex: 0,
        warmupSets: 3,
        workingSets: 3,
        targetReps: '5',
        percent1rm: 77.5, // Progression
        targetRpe: 8,
        restSeconds: 180,
        notes: 'Progression from week 1. Control the eccentric.'
      },
      {
        programWorkoutId: w2d1.id,
        exerciseId: getEx('Barbell Row').id,
        orderIndex: 1,
        warmupSets: 1,
        workingSets: 3,
        targetReps: '8-10',
        targetRpe: 8,
        restSeconds: 120,
        notes: 'Keep back straight, pull to belly button.'
      },
      {
        programWorkoutId: w2d1.id,
        exerciseId: getEx('Overhead Press').id,
        orderIndex: 2,
        warmupSets: 1,
        workingSets: 3,
        targetReps: '8-10',
        targetRpe: 8,
        restSeconds: 120,
        notes: 'Core tight, do not use leg drive.'
      },
      {
        programWorkoutId: w2d1.id,
        exerciseId: getEx('Lat Pulldown').id,
        orderIndex: 3,
        warmupSets: 0,
        workingSets: 3,
        targetReps: '10-12',
        targetRpe: 8, // slight RPE increase
        restSeconds: 90,
        notes: 'Full stretch at the top, squeeze at the bottom.'
      },
      {
        programWorkoutId: w2d1.id,
        exerciseId: getEx('Dumbbell Lateral Raise').id,
        orderIndex: 4,
        warmupSets: 0,
        workingSets: 3,
        targetReps: '12-15',
        targetRpe: 9,
        restSeconds: 90,
        notes: 'Lead with the elbows, slight forward lean.'
      },
      {
        programWorkoutId: w2d1.id,
        exerciseId: getEx('Tricep Extension').id,
        orderIndex: 5,
        warmupSets: 0,
        workingSets: 3,
        targetReps: '10-12',
        targetRpe: 9,
        restSeconds: 90,
        circuitGroup: 'A'
      },
      {
        programWorkoutId: w2d1.id,
        exerciseId: getEx('Bicep Curl').id,
        orderIndex: 6,
        warmupSets: 0,
        workingSets: 3,
        targetReps: '10-12',
        targetRpe: 9,
        restSeconds: 90,
        circuitGroup: 'A'
      }
    ]
  })

  // Week 2 - Day 2: Lower 1
  const w2d2 = await prisma.programWorkout.create({
    data: {
      programWeekId: week2.id,
      dayNumber: 2,
      label: 'Lower Body 1'
    }
  })

  await prisma.programExercise.createMany({
    data: [
      {
        programWorkoutId: w2d2.id,
        exerciseId: getEx('Squat').id,
        orderIndex: 0,
        warmupSets: 3,
        workingSets: 3,
        targetReps: '5',
        percent1rm: 77.5,
        targetRpe: 8,
        restSeconds: 180,
        notes: 'Progression from week 1. Hit depth.'
      },
      {
        programWorkoutId: w2d2.id,
        exerciseId: getEx('Romanian Deadlift').id,
        orderIndex: 1,
        warmupSets: 1,
        workingSets: 3,
        targetReps: '8-10',
        targetRpe: 9,
        restSeconds: 120,
        notes: 'Hinge at the hips, slight bend in knees.'
      },
      {
        programWorkoutId: w2d2.id,
        exerciseId: getEx('Leg Press').id,
        orderIndex: 2,
        warmupSets: 1,
        workingSets: 3,
        targetReps: '10-12',
        targetRpe: 9,
        restSeconds: 120,
        notes: 'Control the descent, do not lock knees.'
      },
      {
        programWorkoutId: w2d2.id,
        exerciseId: getEx('Leg Curl').id,
        orderIndex: 3,
        warmupSets: 0,
        workingSets: 3,
        targetReps: '12-15',
        targetRpe: 9,
        restSeconds: 90,
        notes: 'Squeeze hamstrings at the top.'
      },
      {
        programWorkoutId: w2d2.id,
        exerciseId: getEx('Calf Raise').id,
        orderIndex: 4,
        warmupSets: 0,
        workingSets: 4,
        targetReps: '12-15',
        targetRpe: 10,
        restSeconds: 90,
        notes: 'Pause at the bottom stretch.'
      }
    ]
  })

  // TODO: Add remaining workouts for Week 2 (Day 3-5)
  // TODO: Add Weeks 3-9 (alternating logic/progressions)
  // TODO: Add Week 10 (Max Test Week)
  // TODO: Add Week 11 (Deload)

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
