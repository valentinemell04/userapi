# User API

A simple User API built with Node.js, Express, and Redis for DevOps CI/CD Lab.

## Features

- Create, read, and delete users
- Redis storage
- Health check endpoint
- Comprehensive tests

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Hello World message |
| GET | `/health` | Health check |
| POST | `/user` | Create a user |
| GET | `/user/:username` | Get a user |
| DELETE | `/user/:username` | Delete a user |

## Installation

```bash
npm install
```

## Running locally

Make sure Redis is running, then:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## Running tests

```bash
npm test
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)

## CI/CD

This project uses:
- **GitHub Actions** for Continuous Integration
- **Render** for Continuous Deployment
