"use server";

import { getUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

const optional1RM = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  z.coerce.number().min(0).optional()
);

export const onboardingSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  unitPref: z.enum(["kg", "lb"]),
  squat1rm: optional1RM,
  bench1rm: optional1RM,
  deadlift1rm: optional1RM,
});

export async function submitOnboarding(data: z.infer<typeof onboardingSchema>) {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = onboardingSchema.parse(data);

  // Get the first program (Jeff Nippard)
  const program = await prisma.program.findFirst({ orderBy: { id: "asc" } });
  if (!program) {
    return { error: "No program found. Please seed the database." };
  }

  // Create Profile and Cycle in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.profile.create({
      data: {
        id: user.id,
        displayName: parsed.displayName,
        unitPref: parsed.unitPref,
      },
    });

    await tx.cycle.create({
      data: {
        userId: user.id,
        programId: program.id,
        squat1rm: parsed.squat1rm,
        bench1rm: parsed.bench1rm,
        deadlift1rm: parsed.deadlift1rm,
        currentWeek: 1,
        status: "active",
      },
    });
  });

  redirect("/");
}
