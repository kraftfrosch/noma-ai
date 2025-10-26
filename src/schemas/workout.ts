import { z } from 'zod';

// MARK: - Supporting Types

export const TimeSlotSchema = z.enum(['morning', 'daytime', 'evening']);
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

// MARK: - Category Subcategories

export const GymSubcategorySchema = z.enum([
  'volume_push',
  'volume_pull',
  'volume_legs',
  'volume_core',
  'volume_full_body',
  'max_strength_push',
  'max_strength_pull',
  'max_strength_legs',
  'max_strength_core',
  'max_strength_full_body',
]);
export type GymSubcategory = z.infer<typeof GymSubcategorySchema>;

export const RunSubcategorySchema = z.enum(['base_z2', 'intervals_z4_z5']);
export type RunSubcategory = z.infer<typeof RunSubcategorySchema>;

export const BikeSubcategorySchema = z.enum(['base_z2', 'intervals_z4_z5']);
export type BikeSubcategory = z.infer<typeof BikeSubcategorySchema>;

export const SwimSubcategorySchema = z.enum(['base_z2', 'intervals_z4_z5']);
export type SwimSubcategory = z.infer<typeof SwimSubcategorySchema>;

export const HIITSubcategorySchema = z.enum(['cardio', 'strength_cardio']);
export type HIITSubcategory = z.infer<typeof HIITSubcategorySchema>;

// MARK: - Category (enum with associated values)

export const CategorySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('gym'),
    subcategory: GymSubcategorySchema,
  }),
  z.object({
    type: z.literal('run'),
    subcategory: RunSubcategorySchema,
  }),
  z.object({
    type: z.literal('bike'),
    subcategory: BikeSubcategorySchema,
  }),
  z.object({
    type: z.literal('swim'),
    subcategory: SwimSubcategorySchema,
  }),
  z.object({
    type: z.literal('hiit'),
    subcategory: HIITSubcategorySchema,
  }),
]);
export type Category = z.infer<typeof CategorySchema>;

// MARK: - Volume Types

export const VolumeSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('reps'),
    repetitions: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('duration'),
    seconds: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('distance'),
    kilometers: z.number().positive(),
  }),
]);
export type Volume = z.infer<typeof VolumeSchema>;

// MARK: - Intensity Types

export const IntensitySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('weight'),
    kilogramms: z.number().positive(),
  }),
  z.object({
    type: z.literal('heart_rate'),
    targetBpm: z.number().int().positive(),
  }),
]);
export type Intensity = z.infer<typeof IntensitySchema>;

// MARK: - Exercise Models

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  order: z.number().int().nonnegative(),
  volume: VolumeSchema,
  intensity: IntensitySchema,
  rest: z.number().int().nonnegative().nullable(),
  explanation: z.string().nullable(),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

export const ExerciseRoundSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().nonnegative(),
  rounds: z.number().int().positive(),
  restBetweenRounds: z.number().int().nonnegative(),
  exercises: z.array(ExerciseSchema),
  explanation: z.string(),
});
export type ExerciseRound = z.infer<typeof ExerciseRoundSchema>;

export const WorkoutSchema = z.object({
  id: z.string().uuid(),
  date: z.string().datetime(), // ISO 8601 date string
  timeSlot: TimeSlotSchema,
  title: z.string(),
  category: CategorySchema,
  duration: z.number().int().positive(), // minutes
  completed: z.boolean(),
  exerciseRounds: z.array(ExerciseRoundSchema),
  explanation: z.string(),
});
export type Workout = z.infer<typeof WorkoutSchema>;

// Schema for creating a new workout (without id, can be generated)
export const CreateWorkoutSchema = WorkoutSchema.partial({ id: true });
export type CreateWorkout = z.infer<typeof CreateWorkoutSchema>;

// Schema for updating a workout
export const UpdateWorkoutSchema = WorkoutSchema.partial().required({ id: true });
export type UpdateWorkout = z.infer<typeof UpdateWorkoutSchema>;

