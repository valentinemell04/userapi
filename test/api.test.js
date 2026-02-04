const chai = require('chai');
const { expect } = chai;
const { app, connectRedis, getRedisClient } = require('../src/index');

// Simple HTTP request helper (no external dependencies)
const http = require('http');

let server;
const PORT = 3001;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

describe('User API', function() {
  this.timeout(10000);

  before(async function() {
    await connectRedis();
    server = app.listen(PORT);
  });

  after(async function() {
    const client = getRedisClient();
    if (client && client.isOpen) {
      // Clean up test data
      await client.del('user:testuser');
      await client.quit();
    }
    server.close();
  });

  describe('GET /', function() {
    it('should return Hello World message', async function() {
      const res = await makeRequest('GET', '/');
      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Hello World!');
    });
  });

  describe('GET /health', function() {
    it('should return OK status', async function() {
      const res = await makeRequest('GET', '/health');
      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('OK');
    });
  });

  describe('POST /user', function() {
    it('should create a new user', async function() {
      const client = getRedisClient();
      if (!client || !client.isOpen) {
        this.skip();
      }

      // Clean up before test
      await client.del('user:testuser');

      const res = await makeRequest('POST', '/user', {
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User'
      });

      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal('User created');
      expect(res.body.username).to.equal('testuser');
    });

    it('should return 400 if missing fields', async function() {
      const res = await makeRequest('POST', '/user', {
        username: 'testuser'
      });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('Missing required fields');
    });

    it('should return 409 if user already exists', async function() {
      const client = getRedisClient();
      if (!client || !client.isOpen) {
        this.skip();
      }

      const res = await makeRequest('POST', '/user', {
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User'
      });

      expect(res.status).to.equal(409);
      expect(res.body.error).to.equal('User already exists');
    });
  });

  describe('GET /user/:username', function() {
    it('should get an existing user', async function() {
      const client = getRedisClient();
      if (!client || !client.isOpen) {
        this.skip();
      }

      const res = await makeRequest('GET', '/user/testuser');

      expect(res.status).to.equal(200);
      expect(res.body.username).to.equal('testuser');
      expect(res.body.firstname).to.equal('Test');
      expect(res.body.lastname).to.equal('User');
    });

    it('should return 404 for non-existing user', async function() {
      const client = getRedisClient();
      if (!client || !client.isOpen) {
        this.skip();
      }

      const res = await makeRequest('GET', '/user/nonexistent');

      expect(res.status).to.equal(404);
      expect(res.body.error).to.equal('User not found');
    });
  });

  describe('DELETE /user/:username', function() {
    it('should delete an existing user', async function() {
      const client = getRedisClient();
      if (!client || !client.isOpen) {
        this.skip();
      }

      const res = await makeRequest('DELETE', '/user/testuser');

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('User deleted');
    });

    it('should return 404 for non-existing user', async function() {
      const client = getRedisClient();
      if (!client || !client.isOpen) {
        this.skip();
      }

      const res = await makeRequest('DELETE', '/user/testuser');

      expect(res.status).to.equal(404);
      expect(res.body.error).to.equal('User not found');
    });
  });
});
