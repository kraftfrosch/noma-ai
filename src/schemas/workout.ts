import { z } from "zod";

// MARK: - Supporting Types

export const TimeSlotSchema = z.enum(["morning", "daytime", "evening"]);
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

// MARK: - Category

export const CategorySchema = z.enum([
  "gym/classical_hypertrophy",
  "gym/super_set",
  "gym/max_strength",
  "gym/cool_down",
  "run/base_z2",
  "run/intervals_z4_z5",
  "bike/base_z2",
  "bike/intervals_z4_z5",
  "swim/base_z2",
  "swim/intervals_z4_z5",
  "hiit/cardio",
  "hiit/strength_cardio",
]);
export type Category = z.infer<typeof CategorySchema>;

// MARK: - Volume Types

export const VolumeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("reps"),
    repetitions: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("duration"),
    seconds: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("distance"),
    kilometers: z.number().positive(),
  }),
]);
export type Volume = z.infer<typeof VolumeSchema>;

// MARK: - Intensity Types

export const IntensitySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("weight"),
    kilogramms: z.number().positive(),
  }),
  z.object({
    type: z.literal("heart_rate"),
    targetBpm: z.number().int().positive(),
  }),
]);
export type Intensity = z.infer<typeof IntensitySchema>;

// MARK: - Exercise Models

export const ExerciseSchema = z.object({
  name: z.string(),
  order: z.number().int().nonnegative(),
  volume: VolumeSchema,
  intensity: IntensitySchema,
  restTillNextExerciseInRound: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .describe(
      "The rest duration until the next exercise in the same round in seconds. The value is 0 if it is the last exercise in the block."
    ),
  intentionalRole: z
    .string()
    .describe(
      "Describes the specific role and intended contribution of the exercise within the workout (why it was selected and what critical function it serves)."
    ),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

export const WorkoutBlockSchema = z.object({
  order: z.number().int().nonnegative(),
  numberOfRounds: z.number().int().positive(),
  restBetweenRounds: z
    .number()
    .int()
    .nonnegative()
    .describe(
      "The rest duration between rounds (completion of all exercises in the block) in seconds. Only applies if number of round is greater than 1."
    ),
  exercises: z.array(ExerciseSchema),
  // blockRationale: z.string().describe("The rationale for the block. Why these exercises were grouped into one block."),
});
export type ExerciseRound = z.infer<typeof WorkoutBlockSchema>;

export const WorkoutSchema = z.object({
  id: z.string().uuid(),
  workoutType: CategorySchema.describe("The workout type"),
  duration: z
    .number()
    .int()
    .positive()
    .describe("The approximate duration of the workout in minutes"),
  trainerNotes: z
    .string()
    .describe(
      "Very brief note from the trainer on the rational, special instructions, focus or hints for the athlete."
    ),
  workoutBlocks: z
    .array(WorkoutBlockSchema)
    .describe(
      "The workout blocks of the workout. A block is a single or a group of exercises that are performed consecutively."
    ),
});
export type Workout = z.infer<typeof WorkoutSchema>;

// Schema for creating a new workout (without id, can be generated)
export const CreateWorkoutSchema = WorkoutSchema.partial({ id: true });
export type CreateWorkout = z.infer<typeof CreateWorkoutSchema>;

// Schema for updating a workout
export const UpdateWorkoutSchema = WorkoutSchema.partial().required({
  id: true,
});
export type UpdateWorkout = z.infer<typeof UpdateWorkoutSchema>;
