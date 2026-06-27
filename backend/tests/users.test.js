import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('Users & Auth Module Integration Tests', () => {
  let adminToken;
  let doctorToken;
  let doctorId;
  const adminEmail = 'admin@dcms.com';
  const adminPassword = 'AdminPass123!';

  const uniqueEmail = () => `test.doc.${Date.now()}.${Math.random().toString(36).substring(2, 7)}@dcms.com`;

  beforeAll(async () => {
    // Obtain admin token by logging in
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    
    adminToken = res.body.data.token;
  });

  afterAll(async () => {
    // Cleanup created test users
    if (doctorId) {
      await prisma.user.deleteMany({
        where: {
          id: doctorId,
        },
      });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: adminEmail, password: adminPassword });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(adminEmail);
    });

    it('should fail to login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: adminEmail, password: 'wrongpassword' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeNull();
    });
  });

  describe('POST /api/v1/users', () => {
    it('should reject requests without authorization header', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .send({
          name: 'Test Doctor',
          email: uniqueEmail(),
          password: 'Password123!',
          role: 'DOCTOR',
        });
      expect(res.status).toBe(401);
    });

    it('should allow Admin to create a new Doctor', async () => {
      const docEmail = uniqueEmail();
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Doctor Strange',
          email: docEmail,
          password: 'DoctorPassword123!',
          role: 'DOCTOR',
          specialization: 'Neurology',
          licenseNumber: 'LIC-777',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.role).toBe('DOCTOR');
      expect(res.body.data.specialization).toBe('Neurology');
      expect(res.body.data.licenseNumber).toBe('LIC-777');

      doctorId = res.body.data.id;

      // Obtain token for doctor
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: docEmail, password: 'DoctorPassword123!' });
      
      doctorToken = loginRes.body.data.token;
    });
  });

  describe('GET /api/v1/users', () => {
    it('should allow Admin to list users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should deny access to non-Admin roles (Doctor)', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${doctorToken}`);
      
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should allow user to view their own profile', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${doctorId}`)
        .set('Authorization', `Bearer ${doctorToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(doctorId);
    });

    it('should deny user from viewing another user profile', async () => {
      // Find admin user record to get their id
      const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
      const res = await request(app)
        .get(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${doctorToken}`);
      
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should allow user to update their own fields', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${doctorId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          name: 'Doctor Stephen Strange',
          specialization: 'Sorcery',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Doctor Stephen Strange');
      expect(res.body.data.specialization).toBe('Sorcery');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should deny self-deletion', async () => {
      // admin trying to delete admin
      const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
      const res = await request(app)
        .delete(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot delete your own account');
    });

    it('should allow Admin to soft-delete Doctor', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${doctorId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      
      // Verify soft deleted user returns 404 on lookups
      const checkRes = await request(app)
        .get(`/api/v1/users/${doctorId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(checkRes.status).toBe(404);
    });
  });
});
