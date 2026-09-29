import { ConsoleRedirect } from '../ConsoleRedirect.js';

describe('ConsoleRedirect', () => {
  let stdout: jest.SpyInstance;
  let stderr: jest.SpyInstance;
  let redirect: ConsoleRedirect;

  beforeEach(() => {
    stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    redirect = new ConsoleRedirect();
    redirect.redirectToStderr();
  });

  afterEach(() => {
    redirect.restore();
    stdout.mockRestore();
    stderr.mockRestore();
  });

  it.each(['log', 'info', 'debug'] as const)('should send console.%s to stderr', method => {
    console[method]('legacy', { a: 1 });

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledWith('legacy { a: 1 }\n');
  });

  it('should restore the original console methods', () => {
    const redirected = console.log;

    redirect.restore();

    expect(console.log).not.toBe(redirected);
  });
});
