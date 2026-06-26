import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/common/database/prisma.js';

describe('File Attachments Module Integration Tests', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let testDoctorId;
  let testReceptionistId;
  let attachmentId;

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
        name: 'Attach Receptionist',
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
        name: 'Dr. Wilhelm Röntgen',
        email: docEmail,
        password: 'DocPassword123!',
        role: 'DOCTOR',
        specialization: 'Radiology',
        licenseNumber: 'LIC-ROENTGEN',
      });
    testDoctorId = docRes.body.data.id;

    // Login doctor
    const docLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: docEmail, password: 'DocPassword123!' });
    doctorToken = docLogin.body.data.token;
  });

  afterAll(async () => {
    // Cleanup attachments
    if (testDoctorId) {
      await prisma.attachment.deleteMany({ where: { doctorId: testDoctorId } });
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

  describe('POST /api/v1/attachments', () => {
    it('should successfully upload a file attachment (as Doctor)', async () => {
      const res = await request(app)
        .post('/api/v1/attachments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .attach('file', Buffer.from('dummy-xray-binary-data'), 'panoramic.png')
        .field('fileType', 'X_Ray')
        .field('notes', 'Pre-op panoramic radiography.');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.fileName).toBe('panoramic.png');
      expect(res.body.data.fileType).toBe('X_Ray');
      expect(res.body.data.notes).toBe('Pre-op panoramic radiography.');
      expect(res.body.data.doctor.name).toBe('Dr. Wilhelm Röntgen');

      attachmentId = res.body.data.id;
    });

    it('should allow Admin to upload attachment with specific doctorId', async () => {
      const res = await request(app)
        .post('/api/v1/attachments')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('dummy-prescription-data'), 'rx_scan.pdf')
        .field('fileType', 'Prescription')
        .field('doctorId', testDoctorId)
        .field('notes', 'Scanned prescription.');

      expect(res.status).toBe(201);
      expect(res.body.data.doctorId).toBe(testDoctorId);
      expect(res.body.data.fileType).toBe('Prescription');

      // Cleanup this second upload
      await prisma.attachment.delete({ where: { id: res.body.data.id } });
    });

    it('should deny file upload to Receptionists', async () => {
      const res = await request(app)
        .post('/api/v1/attachments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .attach('file', Buffer.from('dummy-receptionist-upload'), 'chart.png')
        .field('fileType', 'Images');

      expect(res.status).toBe(403);
    });

    it('should fail validation with invalid file extensions (e.g. .exe)', async () => {
      const res = await request(app)
        .post('/api/v1/attachments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .attach('file', Buffer.from('malicious-code'), 'virus.exe')
        .field('fileType', 'Images');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/attachments', () => {
    it('should list attachments with filters and pagination', async () => {
      const res = await request(app)
        .get('/api/v1/attachments')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.attachments.length).toBeGreaterThan(0);
      expect(res.body.data.attachments[0].id).toBe(attachmentId);
    });

    it('should support filtering by fileType', async () => {
      const res = await request(app)
        .get('/api/v1/attachments?fileType=X_Ray')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.attachments[0].fileType).toBe('X_Ray');
    });
  });

  describe('GET /api/v1/attachments/:id', () => {
    it('should retrieve specific attachment metadata details', async () => {
      const res = await request(app)
        .get(`/api/v1/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.fileName).toBe('panoramic.png');
    });
  });

  describe('GET /api/v1/attachments/:id/download', () => {
    it('should download the physical file stream from disk', async () => {
      const res = await request(app)
        .get(`/api/v1/attachments/${attachmentId}/download`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.toString()).toBe('dummy-xray-binary-data');
    });
  });

  describe('DELETE /api/v1/attachments/:id', () => {
    it('should successfully soft-delete the attachment record', async () => {
      const res = await request(app)
        .delete(`/api/v1/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify that lookup returns 404 after deletion
      const checkGet = await request(app)
        .get(`/api/v1/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(checkGet.status).toBe(404);
    });
  });
});
