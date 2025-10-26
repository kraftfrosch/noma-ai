import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { WorkoutSchema, CreateWorkoutSchema, type Workout } from '../schemas/workout.js';
import { randomUUID } from 'crypto';

export const workoutRouter = Router();

// GET /workouts - Fetch all workouts
workoutRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching workouts:', error);
      return res.status(500).json({ error: 'Failed to fetch workouts' });
    }

    // Extract the workout data from the JSONB column
    const workouts = data.map((row) => row.data);

    res.json({ workouts });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /workouts/:id - Fetch a single workout by ID
workoutRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Workout not found' });
      }
      console.error('Error fetching workout:', error);
      return res.status(500).json({ error: 'Failed to fetch workout' });
    }

    res.json({ workout: data.data });
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /workouts - Create a new workout
workoutRouter.post('/', async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const validationResult = CreateWorkoutSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid workout data', 
        details: validationResult.error.issues 
      });
    }

    const workoutData = validationResult.data;
    
    // Generate UUID if not provided
    if (!workoutData.id) {
      workoutData.id = randomUUID();
    }

    // Extract date for indexing (convert ISO string to date)
    const date = new Date(workoutData.date).toISOString().split('T')[0];

    // Insert the workout
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        id: workoutData.id,
        data: workoutData,
        date: date,
        completed: workoutData.completed,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workout:', error);
      return res.status(500).json({ error: 'Failed to create workout' });
    }

    res.status(201).json({ workout: data.data });
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /workouts/:id - Update a workout
workoutRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate the request body
    const validationResult = WorkoutSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid workout data', 
        details: validationResult.error.issues 
      });
    }

    const workoutData = validationResult.data;

    // Ensure ID matches
    if (workoutData.id !== id) {
      return res.status(400).json({ error: 'Workout ID mismatch' });
    }

    // Extract date for indexing
    const date = new Date(workoutData.date).toISOString().split('T')[0];

    // Update the workout
    const { data, error } = await supabase
      .from('workouts')
      .update({
        data: workoutData,
        date: date,
        completed: workoutData.completed,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Workout not found' });
      }
      console.error('Error updating workout:', error);
      return res.status(500).json({ error: 'Failed to update workout' });
    }

    res.json({ workout: data.data });
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /workouts/:id - Delete a workout
workoutRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workout:', error);
      return res.status(500).json({ error: 'Failed to delete workout' });
    }

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

