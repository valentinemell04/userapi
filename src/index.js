const express = require('express');
const { createClient } = require('redis');

const app = express();
const port = process.env.PORT || 3000;

let redisClient = null;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Routes utilisateur (Redis désactivé si non configuré)
app.post('/user', (req, res) => {
  if (!redisClient) {
    return res.status(503).json({ error: 'Redis non configuré' });
  }
  res.json({ message: 'OK (Redis prêt)' });
});

app.get('/user/:username', (req, res) => {
  if (!redisClient) {
    return res.status(503).json({ error: 'Redis non configuré' });
  }
  res.json({ message: 'OK (Redis prêt)' });
});

app.delete('/user/:username', (req, res) => {
  if (!redisClient) {
    return res.status(503).json({ error: 'Redis non configuré' });
  }
  res.json({ message: 'OK (Redis prêt)' });
});

// 🔴 Connexion Redis (Upstash)
async function connectRedis() {
  if (!process.env.REDIS_URL) {
    console.log('Redis désactivé (REDIS_URL absent)');
    return;
  }

  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: true,              // Upstash nécessite TLS
      rejectUnauthorized: false
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
  });

  await redisClient.connect();
  console.log('Redis connecté');

  // Petit test pour vérifier la connexion
  await redisClient.set('test', 'Hello Redis!');
  const value = await redisClient.get('test');
  console.log('Valeur test Redis récupérée :', value);
}

// 🔵 Démarrage serveur
if (require.main === module) {
  connectRedis()
    .finally(() => {
      app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
      });
    });
}

module.exports = { app };
