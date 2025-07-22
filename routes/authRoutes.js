import express from 'express';
import bodyParser from 'body-parser';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

// Render login and register pages
router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

// Register new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.redirect('/login');
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).send('Internal server error');
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Invalid email or password');

    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send('Invalid email or password');

    req.session.userId = user._id;
    res.redirect('/');
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).send('Internal server error');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Error logging out');
    res.redirect('/login');
  });
});

export default router;
