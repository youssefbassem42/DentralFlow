import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('Warehouse & Inventory Management Module Integration Tests', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let testReceptionistId;
  let testDoctorId;
  let itemId1;
  let itemId2;

  const adminEmail = 'admin@dcms.com';
  const adminPassword = 'AdminPass123!';

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
        name: 'Inventory Manager',
        email: recepEmail,
        password: 'RecepPassword123!',
        role: 'RECEPTIONIST',
        shift: 'Evening',
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
        name: 'Dr. Sarah Connor',
        email: docEmail,
        password: 'DocPassword123!',
        role: 'DOCTOR',
        specialization: 'Orthodontics',
        licenseNumber: 'LIC-CONNOR',
      });
    testDoctorId = docRes.body.data.id;

    // Login doctor
    const docLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: docEmail, password: 'DocPassword123!' });
    doctorToken = docLogin.body.data.token;
  });

  afterAll(async () => {
    // Cleanup inventory
    await prisma.inventoryItem.deleteMany({
      where: { createdBy: { in: [testReceptionistId, testDoctorId] } },
    });
    // Cleanup users
    if (testDoctorId) {
      await prisma.user.delete({ where: { id: testDoctorId } });
    }
    if (testReceptionistId) {
      await prisma.user.delete({ where: { id: testReceptionistId } });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/inventory', () => {
    it('should successfully create a low-stock inventory item (as Receptionist)', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          item: 'Latex Gloves Medium',
          quantity: 5,
          minimumQuantity: 10,
          supplier: 'Medical Supply Co',
          price: 15.50,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.item).toBe('Latex Gloves Medium');
      expect(res.body.data.quantity).toBe(5);
      expect(res.body.data.minimumQuantity).toBe(10);
      expect(res.body.data.price).toBe(15.50);
      expect(res.body.data.isLowStock).toBe(true); // 5 <= 10
      expect(res.body.data.creator.name).toBe('Inventory Manager');

      itemId1 = res.body.data.id;
    });

    it('should successfully create an in-stock inventory item (as Receptionist)', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          item: 'Dental Anesthetic',
          quantity: 30,
          minimumQuantity: 15,
          supplier: 'Pharma Logistics',
          price: 45.00,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isLowStock).toBe(false); // 30 > 15

      itemId2 = res.body.data.id;
    });

    it('should deny item creation to Doctors', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          item: 'Dental Mirror',
          quantity: 10,
          minimumQuantity: 2,
          price: 5.00,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/inventory', () => {
    it('should list inventory items and support search filters', async () => {
      const res = await request(app)
        .get('/api/v1/inventory?search=Gloves')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].item).toContain('Gloves');
    });

    it('should filter only low stock items when lowStock=true', async () => {
      const res = await request(app)
        .get('/api/v1/inventory?lowStock=true')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      const containsItem1 = res.body.data.items.some((i) => i.id === itemId1);
      const containsItem2 = res.body.data.items.some((i) => i.id === itemId2);

      expect(containsItem1).toBe(true);
      expect(containsItem2).toBe(false);
    });

    it('should filter only in stock items when lowStock=false', async () => {
      const res = await request(app)
        .get('/api/v1/inventory?lowStock=false')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      const containsItem1 = res.body.data.items.some((i) => i.id === itemId1);
      const containsItem2 = res.body.data.items.some((i) => i.id === itemId2);

      expect(containsItem1).toBe(false);
      expect(containsItem2).toBe(true);
    });
  });

  describe('PATCH /api/v1/inventory/:id', () => {
    it('should update quantity and automatically recalculate low stock status', async () => {
      // Item 1 was lowStock (quantity 5, min 10)
      // We update quantity to 12
      const res = await request(app)
        .patch(`/api/v1/inventory/${itemId1}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          quantity: 12,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(12);
      expect(res.body.data.isLowStock).toBe(false); // 12 > 10 (updated!)
    });
  });

  describe('DELETE /api/v1/inventory/:id', () => {
    it('should deny deletion to Receptionists', async () => {
      const res = await request(app)
        .delete(`/api/v1/inventory/${itemId1}`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow Admin to soft-delete the inventory item', async () => {
      const res = await request(app)
        .delete(`/api/v1/inventory/${itemId1}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify lookup returns 404
      const checkGet = await request(app)
        .get(`/api/v1/inventory/${itemId1}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkGet.status).toBe(404);
    });
  });
});
