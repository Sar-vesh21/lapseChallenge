import express from 'express';
import cors from 'cors';
import feedRoutes from './routes/feed';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Feed routes
app.use('/api', feedRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 