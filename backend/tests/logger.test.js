import logger from '../src/common/logger/index.js';

describe('Winston Logger', () => {
  it('should export info, error, warn, and debug logging functions', () => {
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
    
    // Test that they execute without throwing errors
    expect(() => logger.info('Test log info message')).not.toThrow();
    expect(() => logger.error('Test log error message')).not.toThrow();
  });
});
