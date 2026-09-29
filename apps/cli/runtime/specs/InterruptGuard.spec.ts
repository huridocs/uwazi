import { EventEmitter } from 'events';
import { InterruptGuard } from '../InterruptGuard.js';

describe('InterruptGuard', () => {
  const flush = async () => new Promise(setImmediate);

  it('should run the cleanup and exit with 130 on SIGINT', async () => {
    const signals = new EventEmitter();
    const cleanup = jest.fn().mockResolvedValue(undefined);
    const exit = jest.fn();
    new InterruptGuard(cleanup, exit, signals).listen();

    signals.emit('SIGINT');
    await flush();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(130);
  });

  it('should still exit with 130 when the cleanup fails', async () => {
    const signals = new EventEmitter();
    const exit = jest.fn();
    new InterruptGuard(jest.fn().mockRejectedValue(new Error('boom')), exit, signals).listen();

    signals.emit('SIGINT');
    await flush();

    expect(exit).toHaveBeenCalledWith(130);
  });

  it('should stop listening once stopped', () => {
    const signals = new EventEmitter();
    const guard = new InterruptGuard(jest.fn(), jest.fn(), signals);

    guard.listen();
    expect(signals.listenerCount('SIGINT')).toBe(1);

    guard.stop();
    expect(signals.listenerCount('SIGINT')).toBe(0);
  });
});
