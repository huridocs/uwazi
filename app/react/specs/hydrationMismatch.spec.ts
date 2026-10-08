import { isHydrationMismatch, onRecoverableError } from '../hydrationMismatch.js';

describe('hydrationMismatch', () => {
  it('recognizes the production minified hydration error', () => {
    const error = new Error(
      'Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message'
    );
    expect(isHydrationMismatch(error)).toBe(true);
  });

  it('leaves other errors alone', () => {
    expect(isHydrationMismatch(new Error('boom'))).toBe(false);
    expect(isHydrationMismatch('Hydration failed because the server rendered')).toBe(false);
  });

  it('does not report a hydration mismatch', () => {
    const report = jest.fn();
    Reflect.set(globalThis, 'reportError', report);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    onRecoverableError(
      new Error("Hydration failed because the server rendered text didn't match the client.")
    );
    expect(report).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    Reflect.deleteProperty(globalThis, 'reportError');
  });

  it('reports other recoverable errors', () => {
    const report = jest.fn();
    Reflect.set(globalThis, 'reportError', report);
    const error = new Error('boom');
    onRecoverableError(error);
    expect(report).toHaveBeenCalledWith(error);
    Reflect.deleteProperty(globalThis, 'reportError');
  });
});
