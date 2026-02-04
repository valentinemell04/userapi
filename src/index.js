const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// User routes (without Redis for now)
app.post('/user', (req, res) => {
  res.status(503).json({ error: 'Redis not configured' });
});

app.get('/user/:username', (req, res) => {
  res.status(503).json({ error: 'Redis not configured' });
});

app.delete('/user/:username', (req, res) => {
  res.status(503).json({ error: 'Redis not configured' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

module.exports = { app };