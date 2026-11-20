import { closeSockets } from '../setupSockets.js';

describe('closeSockets', () => {
  it('should not throw when socket.io has not been initialized', () => {
    expect(() => closeSockets()).not.toThrow();
  });
});
