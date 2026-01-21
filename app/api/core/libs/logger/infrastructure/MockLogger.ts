import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';

export const createMockLogger = (): LoggerFactory => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  critical: jest.fn(),
  warning: jest.fn(),
});
