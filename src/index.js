const express = require('express');
const { createClient } = require('redis');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Redis client
let redisClient;

async function connectRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl
  });

  redisClient.on('error', (err) => {
    console.log('Redis Client Error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  try {
    await redisClient.connect();
  } catch (err) {
    console.log('Could not connect to Redis:', err.message);
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Create user
app.post('/user', async (req, res) => {
  const { username, firstname, lastname } = req.body;

  if (!username || !firstname || !lastname) {
    return res.status(400).json({ error: 'Missing required fields: username, firstname, lastname' });
  }

  if (!redisClient || !redisClient.isOpen) {
    return res.status(503).json({ error: 'Redis not available' });
  }

  try {
    // Check if user already exists
    const existingUser = await redisClient.hGetAll(`user:${username}`);
    if (existingUser && Object.keys(existingUser).length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Save user to Redis
    await redisClient.hSet(`user:${username}`, {
      firstname,
      lastname
    });

    res.status(201).json({ message: 'User created', username, firstname, lastname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user
app.get('/user/:username', async (req, res) => {
  const { username } = req.params;

  if (!redisClient || !redisClient.isOpen) {
    return res.status(503).json({ error: 'Redis not available' });
  }

  try {
    const user = await redisClient.hGetAll(`user:${username}`);
    
    if (!user || Object.keys(user).length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ username, ...user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete('/user/:username', async (req, res) => {
  const { username } = req.params;

  if (!redisClient || !redisClient.isOpen) {
    return res.status(503).json({ error: 'Redis not available' });
  }

  try {
    const result = await redisClient.del(`user:${username}`);
    
    if (result === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted', username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export for testing
module.exports = { app, connectRedis, getRedisClient: () => redisClient };

// Start server only if not in test mode
if (require.main === module) {
  connectRedis().then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  });
}
