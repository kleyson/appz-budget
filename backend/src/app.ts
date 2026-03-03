import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { corsMiddleware } from './middleware/cors';
import health from './routes/health';
import auth from './routes/auth';
import categoriesRoute from './routes/categories';
import periodsRoute from './routes/periods';
import incomeTypesRoute from './routes/income-types';
import expensesRoute from './routes/expenses';
import incomesRoute from './routes/incomes';
import monthsRoute from './routes/months';
import summaryRoute from './routes/summary';
import backupRoute from './routes/backup';
import backupsRoute from './routes/backups';
import frontendRoute from './routes/frontend';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', corsMiddleware);

// API routes
app.route('/', health);
app.route('/', auth);
app.route('/', categoriesRoute);
app.route('/', periodsRoute);
app.route('/', incomeTypesRoute);
app.route('/', expensesRoute);
app.route('/', incomesRoute);
app.route('/', monthsRoute);
app.route('/', summaryRoute);
app.route('/', backupRoute);
app.route('/', backupsRoute);

// Frontend static files — must be last (catch-all)
app.route('/', frontendRoute);

export { app };
