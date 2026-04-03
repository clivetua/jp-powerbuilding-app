"use server";

import { getUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

export const onboardingSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  unitPref: z.enum(["kg", "lb"]),
  squat1rm: z.union([z.coerce.number().min(0), z.literal("")]).optional().transform((e) => (e === "" ? undefined : e)),
  bench1rm: z.union([z.coerce.number().min(0), z.literal("")]).optional().transform((e) => (e === "" ? undefined : e)),
  deadlift1rm: z.union([z.coerce.number().min(0), z.literal("")]).optional().transform((e) => (e === "" ? undefined : e)),
});

export async function submitOnboarding(data: z.infer<typeof onboardingSchema>) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const parsed = onboardingSchema.parse(data);

  // Get the first program (Jeff Nippard)
  const program = await prisma.program.findFirst();
  if (!program) {
    throw new Error("No program found. Please seed the database.");
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
