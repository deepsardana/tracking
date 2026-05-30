import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import transactionRoutes from './routes/transactions';
import dashboardRoutes from './routes/dashboard';
import billRoutes from './routes/bills';
import { jwtAuth } from './middleware/jwtAuth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', jwtAuth, customerRoutes);
app.use('/api/transactions', jwtAuth, transactionRoutes);
app.use('/api/dashboard', jwtAuth, dashboardRoutes);
app.use('/api/bills', jwtAuth, billRoutes);

// In production, serve the built React app and let React Router handle all other routes
if (IS_PROD) {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
