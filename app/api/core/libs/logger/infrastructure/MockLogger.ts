import { Logger } from '../contracts/Logger.js';

export const createMockLogger = (): Logger => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  critical: jest.fn(),
  warning: jest.fn(),
});
