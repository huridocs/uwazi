/**
 * @jest-environment jsdom
 */

import { PageRenderQueue } from '../pageRenderQueue.js';

describe('PageRenderQueue', () => {
  it('treats only the prioritized page as highest priority', () => {
    const queue = new PageRenderQueue();
    queue.prioritize(9);

    expect(queue.isPriority(9)).toBe(true);
    expect(queue.isPriority(2)).toBe(false);
  });
});
