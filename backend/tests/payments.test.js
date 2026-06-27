import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('Payments & Financial Records Module Integration Tests', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let testDoctorId;
  let testPatientId;
  let testReceptionistId;
  let testPlanId;
  let paymentId1;
  let paymentId2;

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
        name: 'Billing Receptionist',
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
        name: 'Dr. John Hunter',
        email: docEmail,
        password: 'DocPassword123!',
        role: 'DOCTOR',
        specialization: 'Oral Surgery',
        licenseNumber: 'LIC-HUNTER',
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
        fullName: 'Steve Rogers',
        gender: 'Male',
        dateOfBirth: '1918-07-04',
        phone: uniquePhone(),
        email: 'steve.rogers@avengers.com',
      });
    testPatientId = patientRes.body.data.id;

    // 5. Create a test treatment plan
    const planRes = await request(app)
      .post('/api/v1/treatment-plans')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: testPatientId,
        title: 'Oral Surgery Treatment Plan',
        estimatedCost: 500.00,
        estimatedSessions: 2,
      });
    testPlanId = planRes.body.data.id;

    // 6. Record 2 treatment sessions to establish invoiced items ($120.00 and $180.00 = $300.00)
    await request(app)
      .post('/api/v1/treatments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: testPatientId,
        treatmentPlanId: testPlanId,
        treatmentName: 'Tooth Extraction',
        price: 120.00,
        sessionDate: new Date().toISOString(),
      });

    await request(app)
      .post('/api/v1/treatments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: testPatientId,
        treatmentPlanId: testPlanId,
        treatmentName: 'Bone Grafting',
        price: 180.00,
        sessionDate: new Date().toISOString(),
      });
  });

  afterAll(async () => {
    // Cleanup payments, treatments, treatment plan
    if (testPatientId) {
      await prisma.payment.deleteMany({ where: { patientId: testPatientId } });
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

  describe('POST /api/v1/payments', () => {
    it('should successfully record a payment (as Receptionist)', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          patientId: testPatientId,
          doctorId: testDoctorId,
          amount: 100.00,
          paymentMethod: 'Visa',
          notes: 'Initial copay deposit.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.amount).toBe(100.00);
      expect(res.body.data.paymentMethod).toBe('Visa');
      expect(res.body.data.invoiceNumber).toBeDefined();

      paymentId1 = res.body.data.id;
    });

    it('should successfully record another payment with specific invoiceNumber', async () => {
      const specificInv = `INV-${Date.now()}-SPEC`;
      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          patientId: testPatientId,
          doctorId: testDoctorId,
          amount: 50.00,
          paymentMethod: 'Cash',
          invoiceNumber: specificInv,
          notes: 'Second installment.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(50.00);
      expect(res.body.data.paymentMethod).toBe('Cash');
      expect(res.body.data.invoiceNumber).toBe(specificInv);

      paymentId2 = res.body.data.id;
    });

    it('should fail when using a duplicate invoiceNumber', async () => {
      const firstInv = await prisma.payment.findUnique({
        where: { id: paymentId1 },
      });

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          patientId: testPatientId,
          doctorId: testDoctorId,
          amount: 30.00,
          paymentMethod: 'Wallet',
          invoiceNumber: firstInv.invoiceNumber,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should deny payment recording to Doctors (RBAC check)', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: testPatientId,
          doctorId: testDoctorId,
          amount: 20.00,
          paymentMethod: 'Cash',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/payments', () => {
    it('should retrieve list of payments including revenue calculations', async () => {
      const res = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payments.length).toBeGreaterThanOrEqual(2);

      // Verify overall revenue sum and payment method breakdowns
      const { summary } = res.body.data;
      expect(summary.totalRevenue).toBeGreaterThanOrEqual(150.00);
      expect(summary.breakdown.Visa).toBeGreaterThanOrEqual(100.00);
      expect(summary.breakdown.Cash).toBeGreaterThanOrEqual(50.00);
    });

    it('should filter payments by patientId', async () => {
      const res = await request(app)
        .get(`/api/v1/payments?patientId=${testPatientId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.payments.length).toBe(2);
    });
  });

  describe('GET /api/v1/patients/:id/financial', () => {
    it('should retrieve patient financial history and calculate accurate balance', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${testPatientId}/financial`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patientId).toBe(testPatientId);

      // Total invoiced treatments = 120 + 180 = 300
      expect(res.body.data.totalInvoiced).toBe(300.00);

      // Total payments recorded = 100 + 50 = 150
      expect(res.body.data.totalPaid).toBe(150.00);

      // Outstanding balance = 300 - 150 = 150
      expect(res.body.data.balance).toBe(150.00);

      // Payments list
      expect(res.body.data.payments.length).toBe(2);

      // Treatments list
      expect(res.body.data.treatments.length).toBe(2);
    });

    it('should return 404 for financial lookup of non-existent patient', async () => {
      const dummyId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/v1/patients/${dummyId}/financial`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(404);
    });
  });
});
