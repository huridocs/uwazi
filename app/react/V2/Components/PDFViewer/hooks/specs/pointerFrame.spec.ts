/**
 * @jest-environment jsdom
 */

import { createPointerFrame } from '../pointerFrame.js';

describe('createPointerFrame', () => {
  const frames: FrameRequestCallback[] = [];

  beforeEach(() => {
    frames.length = 0;
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      frames.push(cb);
      return frames.length;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => {
      frames[id - 1] = () => undefined;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('runs only the last scheduled callback on the next frame', () => {
    const frame = createPointerFrame();
    const first = jest.fn();
    const second = jest.fn();

    frame.schedule(first);
    frame.schedule(second);
    frames[0](0);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('does not run a cancelled frame', () => {
    const frame = createPointerFrame();
    const work = jest.fn();

    frame.schedule(work);
    frame.cancel();
    frames.forEach(callback => callback(0));

    expect(work).not.toHaveBeenCalled();
  });
});
