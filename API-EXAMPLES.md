# API Testing Examples

## Start the server

```bash
npm run dev
```

## Test Endpoints

### 1. Create a workout

```bash
curl -X POST http://localhost:3000/workouts \
  -H "Content-Type: application/json" \
  -d @example-workout.json
```

### 2. Get all workouts

```bash
curl http://localhost:3000/workouts
```

### 3. Get a specific workout

```bash
curl http://localhost:3000/workouts/{WORKOUT_ID}
```

Replace `{WORKOUT_ID}` with the actual UUID from the create response.

### 4. Update a workout

```bash
curl -X PUT http://localhost:3000/workouts/{WORKOUT_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "id": "{WORKOUT_ID}",
    "date": "2025-10-26T10:00:00Z",
    "timeSlot": "morning",
    "title": "Updated Upper Body Push",
    "category": {
      "type": "gym",
      "subcategory": "volume_push"
    },
    "duration": 75,
    "completed": true,
    "exerciseRounds": [...],
    "explanation": "Updated workout"
  }'
```

### 5. Delete a workout

```bash
curl -X DELETE http://localhost:3000/workouts/{WORKOUT_ID}
```

## Example Response

When creating or fetching a workout, you'll get:

```json
{
  "workout": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2025-10-26T10:00:00Z",
    "timeSlot": "morning",
    "title": "Upper Body Push Volume",
    "category": {
      "type": "gym",
      "subcategory": "volume_push"
    },
    "duration": 60,
    "completed": false,
    "exerciseRounds": [
      {
        "id": "d1234567-89ab-4def-0123-456789abcdef",
        "order": 0,
        "rounds": 4,
        "restBetweenRounds": 120,
        "exercises": [
          {
            "id": "e1234567-89ab-4def-0123-456789abcdef",
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
            "rest": 90,
            "explanation": "Focus on controlled eccentric phase"
          }
        ],
        "explanation": "Main compound pressing movements"
      }
    ],
    "explanation": "Volume-focused upper body push session targeting chest and shoulders."
  }
}
```

## Validation

The API validates all requests using Zod schemas. Invalid data will return a 400 error with details:

```json
{
  "error": "Invalid workout data",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["title"],
      "message": "Expected string, received number"
    }
  ]
}
```
