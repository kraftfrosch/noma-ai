# Noma AI - Workout Management API

A TypeScript/Express API for managing workout data with Supabase backend storage.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

   - Copy `.env.example` to `.env` (already configured with Supabase credentials)

3. Run the development server:

```bash
npm run dev
```

The server will start on port 3000 (or the PORT environment variable).

## API Endpoints

### GET /workouts

Fetch all workouts, ordered by date (most recent first).

**Response:**

```json
{
  "workouts": [
    {
      "id": "uuid",
      "date": "2025-10-26T10:00:00Z",
      "timeSlot": "morning",
      "title": "Upper Body Strength",
      "category": {
        "type": "gym",
        "subcategory": "volume_push"
      },
      "duration": 60,
      "completed": false,
      "exerciseRounds": [...],
      "explanation": "Focus on chest and shoulders"
    }
  ]
}
```

### GET /workouts/:id

Fetch a single workout by ID.

**Response:**

```json
{
  "workout": {
    /* workout object */
  }
}
```

### POST /workouts

Create a new workout.

**Request Body:**

```json
{
  "date": "2025-10-26T10:00:00Z",
  "timeSlot": "morning",
  "title": "Upper Body Strength",
  "category": {
    "type": "gym",
    "subcategory": "volume_push"
  },
  "duration": 60,
  "completed": false,
  "exerciseRounds": [
    {
      "id": "uuid",
      "order": 0,
      "rounds": 3,
      "restBetweenRounds": 90,
      "exercises": [
        {
          "id": "uuid",
          "name": "Bench Press",
          "order": 0,
          "volume": {
            "type": "reps",
            "repetitions": 10
          },
          "intensity": {
            "type": "weight",
            "kilogramms": 80
          },
          "rest": 120,
          "explanation": "Focus on controlled movement"
        }
      ],
      "explanation": "Compound push movements"
    }
  ],
  "explanation": "Focus on chest and shoulders"
}
```

**Response:**

```json
{
  "workout": {
    /* created workout object with id */
  }
}
```

### PUT /workouts/:id

Update an existing workout (replaces the entire workout object).

**Request Body:** Same as POST, but must include the `id` field matching the URL parameter.

**Response:**

```json
{
  "workout": {
    /* updated workout object */
  }
}
```

### DELETE /workouts/:id

Delete a workout by ID.

**Response:**

```json
{
  "message": "Workout deleted successfully"
}
```

## Data Model

The workout data model follows the Swift model defined in `WorkoutDataModel.swift` with these main types:

### Workout

- `id`: UUID
- `date`: ISO 8601 date string
- `timeSlot`: "morning" | "daytime" | "evening"
- `title`: string
- `category`: Category object (type + subcategory)
- `duration`: number (minutes)
- `completed`: boolean
- `exerciseRounds`: Array of ExerciseRound objects
- `explanation`: string

### Category Types

- **gym**: volume_push, volume_pull, volume_legs, volume_core, volume_full_body, max_strength_push, max_strength_pull, max_strength_legs, max_strength_core, max_strength_full_body
- **run**: base_z2, intervals_z4_z5
- **bike**: base_z2, intervals_z4_z5
- **swim**: base_z2, intervals_z4_z5
- **hiit**: cardio, strength_cardio

### Volume Types

- `reps`: { type: "reps", repetitions: number }
- `duration`: { type: "duration", seconds: number }
- `distance`: { type: "distance", kilometers: number }

### Intensity Types

- `weight`: { type: "weight", kilogramms: number }
- `heart_rate`: { type: "heart_rate", targetBpm: number }

## Database Schema

The Supabase database uses a single `workouts` table with the following structure:

- `id` (UUID, primary key)
- `data` (JSONB) - stores the complete workout object
- `date` (DATE, indexed) - extracted for efficient querying
- `completed` (BOOLEAN, indexed) - extracted for efficient querying
- `created_at` (TIMESTAMP)

This design allows:

- Easy in-place updates of the entire workout object
- Fast queries by date and completion status
- Full flexibility in the workout structure

## Project Structure

```
src/
├── schemas/
│   └── workout.ts       # Zod schemas and TypeScript types
├── lib/
│   └── supabase.ts      # Supabase client configuration
├── routes/
│   └── workout.ts       # Workout API endpoints
└── index.ts             # Express server setup
```

## Technologies

- **Express**: Web framework
- **TypeScript**: Type safety
- **Zod**: Runtime validation
- **Supabase**: PostgreSQL database with REST API
- **dotenv**: Environment variable management
