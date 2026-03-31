/**
 * @jest-environment jsdom
 */

import * as scroller from '#app/V2/helpers/scrollIntoView.js';
import { triggerScroll } from '../helpers.js';

describe('triggerScroll', () => {
  //defined as any since the correct definition of the react ref type has no impact on the test
  let mockRef: any;
  let requestAnimationFrameSpy: jest.SpyInstance;

  jest.useFakeTimers();

  beforeEach(() => {
    jest.spyOn(scroller, 'scrollIntoView');

    mockRef = {
      current: {
        clientHeight: 100,
      },
    };

    requestAnimationFrameSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        setTimeout(cb, 0);
        return 1;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore original implementations
  });

  it('should call scrollIntoView if clientHeight is greater than 0 and return the animation id', () => {
    const frameId = triggerScroll(mockRef, 20);
    expect(scroller.scrollIntoView).toHaveBeenCalledWith(mockRef.current);
    expect(frameId).toBe(20);
  });

  it('should call scrollIntoView if clientHeight changes from 0 to a positive value after a failed attempt', () => {
    mockRef.current!.clientHeight = 0;
    const frameId = triggerScroll(mockRef, 0);
    expect(scroller.scrollIntoView).not.toHaveBeenCalled();
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(0.5);
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2);
    mockRef.current!.clientHeight = 200;
    jest.advanceTimersByTime(1);
    expect(scroller.scrollIntoView).toHaveBeenCalledWith(mockRef.current);
    expect(frameId).toBe(1);
  });
});
