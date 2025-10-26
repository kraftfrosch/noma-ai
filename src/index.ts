import express from 'express';
import { workoutRouter } from './routes/workout.js';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/', (_, res) => res.send('OK'));
app.use('/workouts', workoutRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});