"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { onboardingSchema, submitOnboarding } from "@/actions/onboarding";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OnboardingForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: {
      displayName: "",
      unitPref: "kg",
      squat1rm: undefined,
      bench1rm: undefined,
      deadlift1rm: undefined,
    },
  });

  const unitPref = form.watch("unitPref");

  async function onSubmit(values: z.infer<typeof onboardingSchema>) {
    setIsPending(true);
    setError(null);
    try {
      const res = await submitOnboarding(values);
      if (res?.error) {
        setError(res.error);
        setIsPending(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome</CardTitle>
        <CardDescription>
          Let's get your profile set up so we can personalize your program.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Unit</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-4 pt-1">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="kg"
                            checked={field.value === "kg"}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded-full border-zinc-300 text-black focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-white"
                          />
                          <span className="text-sm font-medium">kg</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="lb"
                            checked={field.value === "lb"}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded-full border-zinc-300 text-black focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-white"
                          />
                          <span className="text-sm font-medium">lb</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-medium">Current 1RMs (Optional)</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Enter your 1-rep maxes to calculate your working sets. You can update these later.
              </p>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="squat1rm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Squat ({unitPref})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="0"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bench1rm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bench ({unitPref})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="0"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadlift1rm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadlift ({unitPref})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="0"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm font-medium text-red-500 dark:text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : "Complete Setup"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
