import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('Treatment Plans Module Integration Tests', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let testDoctorId;
  let testPatientId;
  let testReceptionistId;
  let planId;

  const adminEmail = 'admin@dcms.com';
  const adminPassword = 'AdminPass123!';

  const uniqueEmail = (prefix) => `${prefix}.${Date.now()}@dcms.com`;
  const uniquePhone = () => `+1-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  beforeAll(async () => {
    // 1. Log in admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    adminToken = adminRes.body.data.token;

    // 2. Create a test receptionist
    const recepEmail = uniqueEmail('recep');
    const recepRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Plans Receptionist',
        email: recepEmail,
        password: 'RecepPassword123!',
        role: 'RECEPTIONIST',
        shift: 'Morning',
      });
    testReceptionistId = recepRes.body.data.id;

    // Login receptionist
    const recepLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: recepEmail, password: 'RecepPassword123!' });
    receptionistToken = recepLogin.body.data.token;

    // 3. Create a test doctor
    const docEmail = uniqueEmail('doc');
    const docRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Joseph Lister',
        email: docEmail,
        password: 'DocPassword123!',
        role: 'DOCTOR',
        specialization: 'Orthodontics',
        licenseNumber: 'LIC-LISTER',
      });
    testDoctorId = docRes.body.data.id;

    // Login doctor
    const docLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: docEmail, password: 'DocPassword123!' });
    doctorToken = docLogin.body.data.token;

    // 4. Create a test patient
    const patientRes = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Bruce Banner',
        gender: 'Male',
        dateOfBirth: '1969-12-18',
        phone: uniquePhone(),
        email: 'banner@avengers.com',
      });
    testPatientId = patientRes.body.data.id;
  });

  afterAll(async () => {
    // Cleanup plans by patient
    if (testPatientId) {
      await prisma.treatmentPlan.deleteMany({ where: { patientId: testPatientId } });
    }
    // Cleanup patient
    if (testPatientId) {
      await prisma.patient.delete({ where: { id: testPatientId } });
    }
    // Cleanup users
    if (testDoctorId) {
      await prisma.user.delete({ where: { id: testDoctorId } });
    }
    if (testReceptionistId) {
      await prisma.user.delete({ where: { id: testReceptionistId } });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/treatment-plans', () => {
    it('should successfully propose a treatment plan (as Doctor)', async () => {
      const res = await request(app)
        .post('/api/v1/treatment-plans')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: testPatientId,
          title: 'Root Canal and Crown Restoration',
          description: 'Includes root canal therapy, fiber post, and ceramic crown on tooth #36.',
          estimatedCost: 850.50,
          estimatedSessions: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Root Canal and Crown Restoration');
      expect(res.body.data.estimatedCost).toBe(850.50);
      expect(res.body.data.status).toBe('Pending');
      expect(res.body.data.doctor.name).toBe('Dr. Joseph Lister');
      expect(res.body.data.patient.fullName).toBe('Bruce Banner');

      planId = res.body.data.id;
    });

    it('should allow Admin to propose a plan with specific doctorId', async () => {
      const res = await request(app)
        .post('/api/v1/treatment-plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patientId: testPatientId,
          doctorId: testDoctorId,
          title: 'Invisalign Treatment',
          estimatedCost: 3500.00,
          estimatedSessions: 24,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.doctorId).toBe(testDoctorId);

      // Clean up the admin-created plan
      await prisma.treatmentPlan.delete({ where: { id: res.body.data.id } });
    });

    it('should deny plan creation to Receptionists', async () => {
      const res = await request(app)
        .post('/api/v1/treatment-plans')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          patientId: testPatientId,
          title: 'Unauthorized Plan',
          estimatedCost: 100,
          estimatedSessions: 1,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/treatment-plans', () => {
    it('should allow Receptionist to view plans list (for billing queries)', async () => {
      const res = await request(app)
        .get('/api/v1/treatment-plans')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plans.length).toBeGreaterThan(0);
    });

    it('should support filtering by status', async () => {
      const res = await request(app)
        .get('/api/v1/treatment-plans?status=Pending')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.plans.length).toBeGreaterThan(0);
      expect(res.body.data.plans[0].status).toBe('Pending');
    });
  });

  describe('GET /api/v1/treatment-plans/:id', () => {
    it('should retrieve plan details by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/treatment-plans/${planId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(planId);
    });
  });

  describe('PATCH /api/v1/treatment-plans/:id', () => {
    it('should allow Doctor to activate plan and change cost', async () => {
      const res = await request(app)
        .patch(`/api/v1/treatment-plans/${planId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          status: 'InProgress',
          estimatedCost: 900.00,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('InProgress');
      expect(res.body.data.estimatedCost).toBe(900.00);
    });

    it('should deny Receptionist from updating plan details', async () => {
      const res = await request(app)
        .patch(`/api/v1/treatment-plans/${planId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          status: 'Cancelled',
        });

      expect(res.status).toBe(403);
    });
  });
});
