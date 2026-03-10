import { debounce } from '../debounce';

jest.useFakeTimers();

describe('debounce', () => {
  let func: jest.Mock;
  let debouncedFunc: (...args: any[]) => any;
  const wait = 500;

  beforeEach(() => {
    func = jest.fn();
    debouncedFunc = debounce(func, wait);
  });

  it('should call the function after the specified delay', () => {
    debouncedFunc('test');
    expect(func).not.toHaveBeenCalled();
    jest.advanceTimersByTime(wait);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('test');
  });

  it('should reset the timer if called again before delay', () => {
    debouncedFunc('first call');
    jest.advanceTimersByTime(wait / 2);
    debouncedFunc('second call');
    jest.advanceTimersByTime(wait / 2);
    expect(func).not.toHaveBeenCalled();
    jest.advanceTimersByTime(wait / 2);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('second call');
  });

  it('should call the function immediately if immediate is true', () => {
    debouncedFunc = debounce(func, wait, true);
    debouncedFunc('immediate call');
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('immediate call');
    jest.advanceTimersByTime(wait);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should not call the function again if not called within delay', () => {
    debouncedFunc('single call');
    jest.advanceTimersByTime(wait);
    expect(func).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(wait);
    expect(func).toHaveBeenCalledTimes(1);
  });
});
