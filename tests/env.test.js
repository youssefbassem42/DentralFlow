import { env } from '../src/common/config/env.js';

describe('Environment Variables Config', () => {
  it('should have standard application environment variables parsed', () => {
    expect(env.PORT).toBeDefined();
    expect(typeof env.PORT).toBe('number');
    expect(env.NODE_ENV).toBeDefined();
    expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
    expect(env.DATABASE_URL).toBeDefined();
    expect(env.JWT_SECRET).toBeDefined();
    expect(env.JWT_EXPIRES_IN).toBeDefined();
  });
});
