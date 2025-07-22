import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bodyParser from 'body-parser';
import expenseRoutes from './routes/expenseRoutes.js';
import authRoutes from './routes/authRoutes.js'; // 👈 add this
import env from 'dotenv';

env.config();

const app = express();
const port = 3000;

// Middleware for form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files and EJS setup
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Session Middleware
app.use(session({
  secret: 'yourSecretKey', // 🔒 Change in production
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/quick-budget',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Routes
app.use('/', authRoutes);       // 👈 Handles login, register, logout
app.use('/', expenseRoutes);    // 👈 Handles dashboard, add, delete, filter

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
