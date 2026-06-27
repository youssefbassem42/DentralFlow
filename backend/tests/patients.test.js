import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('Patients Module Integration Tests', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let patientId;
  let testReceptionistId;
  let testDoctorId;

  const adminEmail = 'admin@dcms.com';
  const adminPassword = 'AdminPass123!';

  const uniquePhone = () => `+1-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const uniqueEmail = (prefix) => `${prefix}.${Date.now()}@dcms.com`;

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
        name: 'Jane Receptionist',
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
        name: 'Dr. Gregory House',
        email: docEmail,
        password: 'DocPassword123!',
        role: 'DOCTOR',
        specialization: 'Diagnostic Medicine',
        licenseNumber: 'LIC-HOUSE',
      });
    testDoctorId = docRes.body.data.id;

    // Login doctor
    const docLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: docEmail, password: 'DocPassword123!' });
    doctorToken = docLogin.body.data.token;
  });

  afterAll(async () => {
    // Cleanup patient records created by test receptionist
    if (testReceptionistId) {
      await prisma.patient.deleteMany({ where: { createdBy: testReceptionistId } });
    }
    // Cleanup user records
    if (testReceptionistId) {
      await prisma.user.delete({ where: { id: testReceptionistId } });
    }
    if (testDoctorId) {
      await prisma.user.delete({ where: { id: testDoctorId } });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/patients', () => {
    it('should register a new patient (as Receptionist)', async () => {
      const phone = uniquePhone();
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          fullName: 'Clark Kent',
          gender: 'Male',
          dateOfBirth: '1985-06-18',
          phone,
          email: 'clark@dailyplanet.com',
          address: 'Metropolis',
          bloodGroup: 'O-',
          allergies: 'Kryptonite',
          medicalHistory: 'Superhuman physiology',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.fullName).toBe('Clark Kent');
      expect(res.body.data.bloodGroup).toBe('O-');

      patientId = res.body.data.id;
    });

    it('should fail to register a patient with duplicate phone number', async () => {
      // Find the phone of the patient we just created
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          fullName: 'Clark Duplicate',
          gender: 'Male',
          dateOfBirth: '1985-06-18',
          phone: patient.phone,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    it('should fail validation when fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          fullName: 'Clark Incomplete',
          // missing gender, dateOfBirth, phone
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should deny registration to Doctors', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          fullName: 'Tony Stark',
          gender: 'Male',
          dateOfBirth: '1970-05-29',
          phone: uniquePhone(),
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/patients', () => {
    it('should allow Doctor to view/search patients list', async () => {
      const res = await request(app)
        .get('/api/v1/patients?search=Clark')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patients.length).toBeGreaterThan(0);
      expect(res.body.data.patients[0].fullName).toBe('Clark Kent');
    });

    it('should allow Receptionist to retrieve filtered lists (bloodGroup)', async () => {
      const res = await request(app)
        .get('/api/v1/patients?bloodGroup=O-')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.patients.length).toBeGreaterThan(0);
      expect(res.body.data.patients[0].bloodGroup).toBe('O-');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/patients?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.pagination.total).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/patients/:id', () => {
    it('should allow Doctor to view patient profile by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(patientId);
      expect(res.body.data.creator.name).toBe('Jane Receptionist');
    });

    it('should return 404 for non-existent patient ID', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/v1/patients/${fakeUuid}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/patients/:id', () => {
    it('should allow Receptionist to update patient profile', async () => {
      const res = await request(app)
        .patch(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          address: 'Kent Farm, Smallville',
          allergies: 'Kryptonite and Lead',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.address).toBe('Kent Farm, Smallville');
      expect(res.body.data.allergies).toBe('Kryptonite and Lead');
    });

    it('should deny Doctor from updating patient profile', async () => {
      const res = await request(app)
        .patch(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          address: 'Stark Tower',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/patients/:id', () => {
    it('should deny Doctor from deleting patient', async () => {
      const res = await request(app)
        .delete(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow Receptionist to soft-delete patient', async () => {
      const res = await request(app)
        .delete(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);

      // Verify patient is omitted from subsequent lookups
      const checkRes = await request(app)
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkRes.status).toBe(404);
    });

    it('should allow Admin to soft-delete patient', async () => {
      // Register a temporary patient first
      const phone = uniquePhone();
      const createRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          fullName: 'Barry Allen',
          gender: 'Male',
          dateOfBirth: '1989-10-20',
          phone,
        });
      const tempPatientId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/patients/${tempPatientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify patient is omitted
      const checkRes = await request(app)
        .get(`/api/v1/patients/${tempPatientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkRes.status).toBe(404);
    });
  });
});
