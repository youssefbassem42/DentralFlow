import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('Treatment Sessions Module Integration Tests', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let testDoctorId;
  let testPatientId;
  let testReceptionistId;
  let testPlanId;
  let treatmentId;

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
        name: 'Treatments Receptionist',
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
        name: 'Dr. G.V. Black',
        email: docEmail,
        password: 'DocPassword123!',
        role: 'DOCTOR',
        specialization: 'Operative Dentistry',
        licenseNumber: 'LIC-BLACK',
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
        fullName: 'Tony Stark',
        gender: 'Male',
        dateOfBirth: '1970-05-29',
        phone: uniquePhone(),
        email: 'tony@starkindustries.com',
      });
    testPatientId = patientRes.body.data.id;

    // 5. Create a test treatment plan
    const planRes = await request(app)
      .post('/api/v1/treatment-plans')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: testPatientId,
        title: 'Composite Restoration Plan',
        estimatedCost: 300.00,
        estimatedSessions: 2,
      });
    testPlanId = planRes.body.data.id;
  });

  afterAll(async () => {
    // Cleanup treatments
    if (testPatientId) {
      await prisma.treatment.deleteMany({ where: { patientId: testPatientId } });
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

  describe('POST /api/v1/treatments', () => {
    it('should successfully record a treatment session (as Doctor)', async () => {
      const res = await request(app)
        .post('/api/v1/treatments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: testPatientId,
          treatmentPlanId: testPlanId,
          treatmentName: 'Class I Composite Restoration',
          toothNumber: 36,
          procedure: 'Excavated caries from occlusal surface, acid-etched, bonded, and placed composite resin.',
          price: 150.00,
          sessionDate: new Date().toISOString(),
          notes: 'Occlusion checked, looks perfect.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.treatmentName).toBe('Class I Composite Restoration');
      expect(res.body.data.price).toBe(150.00);
      expect(res.body.data.toothNumber).toBe(36);
      expect(res.body.data.doctor.name).toBe('Dr. G.V. Black');
      expect(res.body.data.patient.fullName).toBe('Tony Stark');
      expect(res.body.data.treatmentPlan.title).toBe('Composite Restoration Plan');

      treatmentId = res.body.data.id;
    });

    it('should allow Admin to record treatment session with specific doctorId', async () => {
      const res = await request(app)
        .post('/api/v1/treatments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patientId: testPatientId,
          treatmentPlanId: testPlanId,
          doctorId: testDoctorId,
          treatmentName: 'Class II Composite Restoration',
          toothNumber: 37,
          price: 180.00,
          sessionDate: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.doctorId).toBe(testDoctorId);

      // Clean up admin treatment record
      await prisma.treatment.delete({ where: { id: res.body.data.id } });
    });

    it('should deny treatment recording to Receptionists', async () => {
      const res = await request(app)
        .post('/api/v1/treatments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          patientId: testPatientId,
          treatmentPlanId: testPlanId,
          treatmentName: 'Unauthorized Treatment',
          price: 50.00,
          sessionDate: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
    });

    it('should fail validation with invalid payload parameters', async () => {
      const res = await request(app)
        .post('/api/v1/treatments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: testPatientId,
          treatmentPlanId: testPlanId,
          // missing treatmentName, price, sessionDate
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/treatments', () => {
    it('should allow Receptionist to list treatment sessions (read-only for checkout/billing)', async () => {
      const res = await request(app)
        .get('/api/v1/treatments')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.treatments.length).toBeGreaterThan(0);
    });

    it('should support filtering by treatmentPlanId', async () => {
      const res = await request(app)
        .get(`/api/v1/treatments?treatmentPlanId=${testPlanId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.treatments.length).toBeGreaterThan(0);
      expect(res.body.data.treatments[0].treatmentPlanId).toBe(testPlanId);
    });
  });

  describe('GET /api/v1/treatments/:id', () => {
    it('should retrieve specific treatment details by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/treatments/${treatmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(treatmentId);
    });
  });

  describe('PATCH /api/v1/treatments/:id', () => {
    it('should allow Doctor to update treatment details', async () => {
      const res = await request(app)
        .patch(`/api/v1/treatments/${treatmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          procedure: 'Excavated deep caries from occlusal surface, restored with composite.',
          notes: 'Occlusion perfect, advised patient not to chew on hard items for 24h.',
          price: 160.00,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.procedure).toBe('Excavated deep caries from occlusal surface, restored with composite.');
      expect(res.body.data.notes).toBe('Occlusion perfect, advised patient not to chew on hard items for 24h.');
      expect(res.body.data.price).toBe(160.00);
    });

    it('should ignore attempts to change patientId or treatmentPlanId', async () => {
      const dummyUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .patch(`/api/v1/treatments/${treatmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: dummyUuid,
          treatmentPlanId: dummyUuid,
          treatmentName: 'Restoration (Updated)',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.patientId).toBe(testPatientId);
      expect(res.body.data.treatmentPlanId).toBe(testPlanId);
      expect(res.body.data.treatmentName).toBe('Restoration (Updated)');
    });

    it('should deny Receptionist from updating treatment sessions', async () => {
      const res = await request(app)
        .patch(`/api/v1/treatments/${treatmentId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          price: 200.00,
        });

      expect(res.status).toBe(403);
    });
  });
});
