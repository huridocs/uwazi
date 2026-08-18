/**
 * @jest-environment jsdom
 */

import * as scroller from '#app/V2/helpers/scrollIntoView.js';
import { triggerScroll, pickMostVisiblePage } from '../helpers.js';

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

describe('pickMostVisiblePage', () => {
  it('picks the page with the greatest visible height', () => {
    const visibleHeightByPage = new Map([
      [8, 200],
      [9, 500],
      [10, 180],
    ]);
    expect(pickMostVisiblePage(visibleHeightByPage, 23)).toBe(9);
  });

  it('keeps the previous page when visible heights tie', () => {
    const visibleHeightByPage = new Map([
      [8, 300],
      [9, 300],
    ]);
    expect(pickMostVisiblePage(visibleHeightByPage, 23, 9)).toBe(9);
  });

  it('ignores pages outside the document range', () => {
    const visibleHeightByPage = new Map([
      [0, 800],
      [2, 100],
      [99, 900],
    ]);
    expect(pickMostVisiblePage(visibleHeightByPage, 4)).toBe(2);
  });
});
