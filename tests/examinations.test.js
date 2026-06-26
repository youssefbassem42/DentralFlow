import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('Clinical Examinations Module Integration Tests', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let testDoctorId;
  let testPatientId;
  let testReceptionistId;
  let examId;

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
        name: 'Exam Receptionist',
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
        name: 'Dr. Elizabeth Blackwell',
        email: docEmail,
        password: 'DocPassword123!',
        role: 'DOCTOR',
        specialization: 'Pediatric Dentistry',
        licenseNumber: 'LIC-BLACKWELL',
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
        fullName: 'Peter Parker',
        gender: 'Male',
        dateOfBirth: '2001-08-10',
        phone: uniquePhone(),
        email: 'peter@dailybugle.com',
      });
    testPatientId = patientRes.body.data.id;
  });

  afterAll(async () => {
    // Cleanup examinations
    if (examId) {
      await prisma.medicalExamination.delete({ where: { id: examId } });
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

  describe('POST /api/v1/examinations', () => {
    it('should successfully record a medical exam (as Doctor)', async () => {
      const res = await request(app)
        .post('/api/v1/examinations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: testPatientId,
          chiefComplaint: 'Toothache on tapping lower right molar',
          diagnosis: 'Periapical abscess on #46',
          clinicalNotes: 'Initiated root canal treatment, pulp extirpated.',
          prescription: 'Amoxicillin 500mg, Paracetamol 500mg',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.chiefComplaint).toBe('Toothache on tapping lower right molar');
      expect(res.body.data.diagnosis).toBe('Periapical abscess on #46');
      expect(res.body.data.doctor.name).toBe('Dr. Elizabeth Blackwell');
      expect(res.body.data.patient.fullName).toBe('Peter Parker');

      examId = res.body.data.id;
    });

    it('should allow Admin to record an exam with specific doctorId', async () => {
      const res = await request(app)
        .post('/api/v1/examinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patientId: testPatientId,
          doctorId: testDoctorId,
          chiefComplaint: 'Gingival bleeding',
          diagnosis: 'Generalized gingivitis',
          clinicalNotes: 'Scaling and polishing performed.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.doctorId).toBe(testDoctorId);

      // Clean up the admin-created test exam
      await prisma.medicalExamination.delete({ where: { id: res.body.data.id } });
    });

    it('should deny recording exams to Receptionists', async () => {
      const res = await request(app)
        .post('/api/v1/examinations')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          patientId: testPatientId,
          chiefComplaint: 'Pain',
          diagnosis: 'Caries',
        });

      expect(res.status).toBe(403);
    });

    it('should fail validation when fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/examinations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: testPatientId,
          // missing chiefComplaint, diagnosis
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/examinations', () => {
    it('should allow Doctor to view list of examinations', async () => {
      const res = await request(app)
        .get('/api/v1/examinations')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.examinations.length).toBeGreaterThan(0);
    });

    it('should support filtering by patientId', async () => {
      const res = await request(app)
        .get(`/api/v1/examinations?patientId=${testPatientId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.examinations.length).toBeGreaterThan(0);
      expect(res.body.data.examinations[0].patientId).toBe(testPatientId);
    });

    it('should deny Receptionist from listing examinations', async () => {
      const res = await request(app)
        .get('/api/v1/examinations')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/examinations/:id', () => {
    it('should retrieve examination details by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/examinations/${examId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(examId);
    });
  });

  describe('PATCH /api/v1/examinations/:id', () => {
    it('should allow Doctor to update examination notes', async () => {
      const res = await request(app)
        .patch(`/api/v1/examinations/${examId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          clinicalNotes: 'Extirpated pulp, irrigated with sodium hypochlorite, closed with Cavit.',
          prescription: 'Amoxicillin 500mg, Ibuprofen 400mg',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.clinicalNotes).toBe('Extirpated pulp, irrigated with sodium hypochlorite, closed with Cavit.');
      expect(res.body.data.prescription).toBe('Amoxicillin 500mg, Ibuprofen 400mg');
    });

    it('should ignore attempts to change patientId', async () => {
      const anotherPatientUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .patch(`/api/v1/examinations/${examId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: anotherPatientUuid, // Should be omitted by validation/routes
          diagnosis: 'Periapical abscess on #46 (Updated)',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.patientId).toBe(testPatientId); // Patient ID remained unchanged
      expect(res.body.data.diagnosis).toBe('Periapical abscess on #46 (Updated)');
    });
  });
});
