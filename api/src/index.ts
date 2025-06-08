import express from 'express';
import cors from 'cors';
import feedRoutes from './routes/feed';
import logger from './utils/logger';

const app = express();
const port = process.env.PORT || 3000;

// TODO: Add more specific CORS rules
app.use(cors());

app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  logger.debug('Health check endpoint called');
  res.json({ status: 'ok' });
});

// Feed routes
app.use('/api', feedRoutes);


app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}); 