import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('Express Application Integration Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /health', () => {
    it('should redirect /health to /api/v1/health', async () => {
      const response = await request(app).get('/health');
      expect([301, 302]).toContain(response.status);
      expect(response.headers.location).toBe('/api/v1/health');
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 and a healthy status report', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('healthy');
      expect(response.body.data.database).toBe('connected');
      expect(response.body.data.uptime).toBeDefined();
    });
  });

  describe('GET /api-docs', () => {
    it('should serve Swagger UI documentation', async () => {
      const response = await request(app).get('/api-docs/');
      expect([200, 301, 302]).toContain(response.status);
    });
  });

  describe('Handling 404 Routes', () => {
    it('should return a JSON 404 response for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown-endpoint');
      expect(response.status).toBe(404);
      expect(response.body).toBeDefined();
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot find GET');
      expect(response.body.errors).toBeDefined();
    });
  });
});
