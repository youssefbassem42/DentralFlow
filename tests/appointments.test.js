import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('Appointments Module Integration Tests', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let testDoctorId;
  let testPatientId;
  let testReceptionistId;
  let appointmentId1;
  let appointmentId2;

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
        name: 'Appt Receptionist',
        email: recepEmail,
        password: 'RecepPassword123!',
        role: 'RECEPTIONIST',
        shift: 'Afternoon',
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
        name: 'Dr. John Watson',
        email: docEmail,
        password: 'DocPassword123!',
        role: 'DOCTOR',
        specialization: 'General Dentistry',
        licenseNumber: 'LIC-WATSON',
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
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        fullName: 'Sherlock Holmes',
        gender: 'Male',
        dateOfBirth: '1854-01-06',
        phone: uniquePhone(),
        email: 'sherlock@bakerstreet.com',
      });
    testPatientId = patientRes.body.data.id;
  });

  afterAll(async () => {
    // Cleanup appointments
    await prisma.appointment.deleteMany({
      where: {
        id: { in: [appointmentId1, appointmentId2].filter(Boolean) },
      },
    });
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

  describe('POST /api/v1/appointments', () => {
    it('should successfully book an appointment (as Receptionist)', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          patientId: testPatientId,
          doctorId: testDoctorId,
          appointmentDate: '2026-10-15',
          appointmentTime: '10:00',
          reason: 'Checkup',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.appointmentTime).toBe('10:00');
      expect(res.body.data.patient.fullName).toBe('Sherlock Holmes');
      expect(res.body.data.doctor.name).toBe('Dr. John Watson');

      appointmentId1 = res.body.data.id;
    });

    it('should prevent double-booking the same doctor at the same date and time', async () => {
      // Try to book the same doctor, same date, same time for another patient (or same patient)
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          patientId: testPatientId,
          doctorId: testDoctorId,
          appointmentDate: '2026-10-15',
          appointmentTime: '10:00',
          reason: 'Duplicate slot check',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already booked');
    });

    it('should allow booking a different doctor at the same date and time', async () => {
      // Find admin user who is also a user (though doesn't have doctor relation)
      // For this test, let's create a second doctor first.
      const docEmail2 = uniqueEmail('doc2');
      const docRes2 = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Charles Xavier',
          email: docEmail2,
          password: 'Doc2Password123!',
          role: 'DOCTOR',
          specialization: 'Neurology',
          licenseNumber: 'LIC-XAVIER',
        });
      const doctorId2 = docRes2.body.data.id;

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          patientId: testPatientId,
          doctorId: doctorId2,
          appointmentDate: '2026-10-15',
          appointmentTime: '10:00',
          reason: 'Consultation',
        });

      expect(res.status).toBe(201);
      appointmentId2 = res.body.data.id;

      // Cleanup doctor2
      await prisma.appointment.delete({ where: { id: appointmentId2 } });
      await prisma.user.delete({ where: { id: doctorId2 } });
    });
  });

  describe('GET /api/v1/appointments', () => {
    it('should allow Doctor to view their own schedule', async () => {
      const res = await request(app)
        .get(`/api/v1/appointments?doctorId=${testDoctorId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointments.length).toBeGreaterThan(0);
      expect(res.body.data.appointments[0].doctorId).toBe(testDoctorId);
    });

    it('should filter by specific date', async () => {
      const res = await request(app)
        .get('/api/v1/appointments?appointmentDate=2026-10-15')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.appointments.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/appointments?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(1);
    });
  });

  describe('PATCH /api/v1/appointments/:id', () => {
    it('should allow Receptionist to reschedule appointment', async () => {
      const res = await request(app)
        .patch(`/api/v1/appointments/${appointmentId1}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          appointmentTime: '11:30',
          notes: 'Moved to later slot',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.appointmentTime).toBe('11:30');
      expect(res.body.data.notes).toBe('Moved to later slot');
    });

    it('should deny Doctors from rescheduling appointment', async () => {
      const res = await request(app)
        .patch(`/api/v1/appointments/${appointmentId1}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          appointmentTime: '12:00',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/appointments/:id', () => {
    it('should allow Receptionist to cancel/soft-delete appointment', async () => {
      const res = await request(app)
        .delete(`/api/v1/appointments/${appointmentId1}`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('cancelled');

      // Verify the appointment status is updated to Cancelled
      const checkRes = await request(app)
        .get(`/api/v1/appointments/${appointmentId1}`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(checkRes.status).toBe(404); // Soft deleted items are excluded from findById in repo
    });
  });
});
