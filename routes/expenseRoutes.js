import express from 'express';
import Expense from '../models/Expense.js';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

// Middleware: Check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
}

// GET / → Show user's filtered expenses
router.get('/', isAuthenticated, async (req, res) => {
  const { category, fromDate, toDate } = req.query;
  const filter = { userId: req.session.userId };

  if (category && category !== 'All') filter.category = category;
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  try {
    const expenses = await Expense.find(filter).sort({ createdAt: -1 });

    const categoryTotals = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.session.userId) } }, // filter per user
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const chartData = {
      labels: categoryTotals.map(item => item._id),
      values: categoryTotals.map(item => item.total)
    };

    res.render('index', {
      expenses,
      selectedCategory: category || 'All',
      fromDate,
      toDate,
      chartLabels: JSON.stringify(chartData.labels),
      chartValues: JSON.stringify(chartData.values)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



// POST /add → Add a new expense
router.post('/add', isAuthenticated, async (req, res) => {
  const { description, amount, category } = req.body;
  try {
    await Expense.create({
      description,
      amount,
      category,
      userId: req.session.userId,
    });
    res.redirect('/');
  } catch (err) {
    res.status(400).send('Failed to add expense');
  }
});

// POST /delete/:id → Delete an expense
router.post('/delete/:id', isAuthenticated, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!expense) return res.status(404).send('Expense not found');

    await Expense.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error deleting expense');
  }
});

// GET /edit/:id → Render edit form
router.get('/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!expense) return res.status(404).send('Expense not found');

    res.render('edit', { expense });
  } catch (err) {
    res.status(500).send('Error fetching expense for edit');
  }
});

// POST /edit/:id → Handle edit form submission
router.post('/edit/:id', isAuthenticated, async (req, res) => {
  const { description, amount, category } = req.body;

  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!expense) return res.status(404).send('Expense not found');

    expense.description = description;
    expense.amount = amount;
    expense.category = category;

    await expense.save();
    res.redirect('/');
  } catch (err) {
    res.status(400).send('Failed to update expense');
  }
});

export default router;
