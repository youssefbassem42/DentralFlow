import { hashPassword, comparePassword } from '../src/common/utils/hash.js';
import { generateToken, verifyToken } from '../src/common/utils/jwt.js';
import { authorize } from '../src/common/middleware/rbac.js';

describe('Security & Authentication Infrastructure', () => {
  describe('Password Hashing Utility', () => {
    it('should hash a password and match it correctly', async () => {
      const password = 'SecretPassword123!';
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      
      const match = await comparePassword(password, hash);
      expect(match).toBe(true);

      const mismatch = await comparePassword('wrong_password', hash);
      expect(mismatch).toBe(false);
    });
  });

  describe('JWT Utility', () => {
    it('should sign a token and verify it correctly', () => {
      const payload = { id: 'user-id-123', role: 'ADMIN' };
      const token = generateToken(payload);
      expect(token).toBeDefined();

      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });
  });

  describe('RBAC Authorization Middleware', () => {
    let mockReq;
    let mockRes;
    let calledArgs;
    let nextFunction;

    beforeEach(() => {
      mockReq = {};
      mockRes = {};
      calledArgs = null;
      nextFunction = (...args) => {
        calledArgs = args;
      };
    });

    it('should allow user if role matches allowed roles', () => {
      mockReq.user = { role: 'ADMIN' };
      const middleware = authorize('ADMIN', 'DOCTOR');
      middleware(mockReq, mockRes, nextFunction);
      expect(calledArgs).toEqual([]); // called with no arguments
    });

    it('should pass ForbiddenError to next if role does not match', () => {
      mockReq.user = { role: 'RECEPTIONIST' };
      const middleware = authorize('ADMIN', 'DOCTOR');
      middleware(mockReq, mockRes, nextFunction);
      
      expect(calledArgs).toBeDefined();
      const errorArg = calledArgs[0];
      expect(errorArg).toBeDefined();
      expect(errorArg.statusCode).toBe(403);
      expect(errorArg.message).toContain('permission');
    });

    it('should pass UnauthorizedError if user is not authenticated', () => {
      const middleware = authorize('ADMIN');
      middleware(mockReq, mockRes, nextFunction);

      expect(calledArgs).toBeDefined();
      const errorArg = calledArgs[0];
      expect(errorArg).toBeDefined();
      expect(errorArg.statusCode).toBe(401);
    });
  });
});
