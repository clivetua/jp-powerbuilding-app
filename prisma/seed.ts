import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import { ProgramSchema } from "../src/lib/schemas/program";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database from JSON files...");

  // Clear existing programs and dependencies to avoid duplicates on re-seed
  await prisma.programExercise.deleteMany();
  await prisma.programWorkout.deleteMany();
  await prisma.programWeek.deleteMany();
  await prisma.program.deleteMany();

  const programsDir = path.join(process.cwd(), "data/programs");
  if (!fs.existsSync(programsDir)) {
    console.log(`Directory ${programsDir} not found.`);
    return;
  }

  const files = fs.readdirSync(programsDir).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const filePath = path.join(programsDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(fileContent);

    // Validate using Zod schema
    const programData = ProgramSchema.parse(jsonData);

    await prisma.$transaction(async (tx) => {
      console.log(`  Upserting exercises for ${programData.name}...`);
      const exerciseMap = new Map<string, string>(); // name -> id

      // Extract all unique exercises from the program
      for (const week of programData.weeks) {
        for (const workout of week.workouts) {
          for (const exercise of workout.exercises) {
            if (!exerciseMap.has(exercise.name)) {
              // Manual upsert using name as unique identifier
              let existingEx = await tx.exercise.findFirst({
                where: { name: exercise.name },
              });

              if (existingEx) {
                // Update existing exercise details
                existingEx = await tx.exercise.update({
                  where: { id: existingEx.id },
                  data: {
                    muscleGroup: exercise.muscleGroup,
                    category: exercise.category,
                    demoVideoUrl: exercise.demoVideoUrl,
                  },
                });
              } else {
                // Create new exercise
                existingEx = await tx.exercise.create({
                  data: {
                    name: exercise.name,
                    muscleGroup: exercise.muscleGroup,
                    category: exercise.category,
                    demoVideoUrl: exercise.demoVideoUrl,
                  },
                });
              }
              exerciseMap.set(exercise.name, existingEx.id);
            }
          }
        }
      }

      console.log(`  Creating program: ${programData.name}...`);
      const program = await tx.program.create({
        data: {
          name: programData.name,
          description: programData.description,
          totalWeeks: programData.totalWeeks,
          daysPerWeek: programData.daysPerWeek,
        },
      });

      for (const week of programData.weeks) {
        const programWeek = await tx.programWeek.create({
          data: {
            programId: program.id,
            weekNumber: week.weekNumber,
            type: week.type,
          },
        });

        for (const workout of week.workouts) {
          const programWorkout = await tx.programWorkout.create({
            data: {
              programWeekId: programWeek.id,
              dayNumber: workout.dayNumber,
              label: workout.label,
            },
          });

          // Create program exercises
          const programExercisesData = workout.exercises.map((ex) => ({
            programWorkoutId: programWorkout.id,
            exerciseId: exerciseMap.get(ex.name)!,
            orderIndex: ex.orderIndex,
            warmupSets: ex.warmupSets,
            workingSets: ex.workingSets,
            targetReps: ex.targetReps,
            percent1rm: ex.percent1rm,
            targetRpe: ex.targetRpe,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
            circuitGroup: ex.circuitGroup,
          }));

          await tx.programExercise.createMany({
            data: programExercisesData,
          });
        }
      }
    });
    console.log(`  Successfully seeded ${programData.name}.`);
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
