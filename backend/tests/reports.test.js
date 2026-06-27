import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('Reports & Dashboard Module Integration Tests', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let testDoctorId;
  let testReceptionistId;
  let testPatientId;
  let testAppointmentId;
  let testPlanId;
  let testPaymentId;
  let testInventoryId;

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
        name: 'Report Recep',
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

    // 5. Create appointment (today!)
    const today = new Date();
    const appointmentRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: testPatientId,
        doctorId: testDoctorId,
        appointmentDate: today.toISOString(),
        appointmentTime: '10:00',
        reason: 'Routine checkup',
      });
    testAppointmentId = appointmentRes.body.data.id;

    // 6. Create treatment plan
    const planRes = await request(app)
      .post('/api/v1/treatment-plans')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: testPatientId,
        title: 'Diagnostic Treatment Plan',
        estimatedCost: 1000.00,
        estimatedSessions: 3,
      });
    testPlanId = planRes.body.data.id;

    // 7. Create payment ($150)
    const paymentRes = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: testPatientId,
        doctorId: testDoctorId,
        amount: 150.00,
        paymentMethod: 'Cash',
        notes: 'Consultation fee',
      });
    testPaymentId = paymentRes.body.data.id;

    // 8. Create low stock inventory item (qty 3, min 10, price $25 -> total value $75)
    const inventoryRes = await request(app)
      .post('/api/v1/inventory')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        item: 'Syringes 5ml',
        quantity: 3,
        minimumQuantity: 10,
        supplier: 'MediSupply',
        price: 25.00,
      });
    testInventoryId = inventoryRes.body.data.id;
  });

  afterAll(async () => {
    // Cleanup inventory
    if (testInventoryId) {
      await prisma.inventoryItem.delete({ where: { id: testInventoryId } });
    }
    // Cleanup payments
    if (testPaymentId) {
      await prisma.payment.delete({ where: { id: testPaymentId } });
    }
    // Cleanup appointment
    if (testAppointmentId) {
      await prisma.appointment.delete({ where: { id: testAppointmentId } });
    }
    // Cleanup plans
    if (testPlanId) {
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

  describe('GET /api/v1/reports/dashboard', () => {
    it('should successfully compile dashboard aggregate report stats (as Admin)', async () => {
      const res = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;

      // Patients count check
      expect(data.patients.total).toBeGreaterThanOrEqual(1);
      expect(data.patients.registeredThisMonth).toBeGreaterThanOrEqual(1);

      // Doctors count check
      expect(data.doctors.total).toBeGreaterThanOrEqual(1);
      expect(data.doctors.active).toBeGreaterThanOrEqual(1);

      // Today's appointments count check
      expect(data.appointments.todayCount).toBeGreaterThanOrEqual(1);

      // Revenue sum check
      expect(data.revenue.total).toBeGreaterThanOrEqual(150.00);

      // Low stock count check
      expect(data.inventory.lowStockCount).toBeGreaterThanOrEqual(1);
    });

    it('should deny dashboard stats to Doctors (RBAC boundary)', async () => {
      const res = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
    });

    it('should deny dashboard stats to Receptionists (RBAC boundary)', async () => {
      const res = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/reports/revenue', () => {
    it('should successfully compile filtered revenue details (as Admin)', async () => {
      const todayDate = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/v1/reports/revenue?startDate=${todayDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRevenue).toBeGreaterThanOrEqual(150.00);
      expect(res.body.data.payments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/reports/inventory', () => {
    it('should successfully calculate total warehouse stock value and low stock alerts', async () => {
      const res = await request(app)
        .get('/api/v1/reports/inventory')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;

      // The item we created has qty 3 * price $25 = $75.
      expect(data.totalWarehouseValue).toBeGreaterThanOrEqual(75.00);
      expect(data.lowStockCount).toBeGreaterThanOrEqual(1);

      const containsItem = data.lowStockItems.some((i) => i.id === testInventoryId);
      expect(containsItem).toBe(true);
    });
  });
});
