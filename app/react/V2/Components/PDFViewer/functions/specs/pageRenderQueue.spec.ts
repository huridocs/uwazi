/**
 * @jest-environment jsdom
 */

import { PageRenderQueue } from '../pageRenderQueue.js';

const flushQueue = async () => {
  await Promise.resolve();
};

describe('PageRenderQueue', () => {
  it('treats only the prioritized page as highest priority', () => {
    const queue = new PageRenderQueue();
    queue.prioritize(9);

    expect(queue.isPriority(9)).toBe(true);
    expect(queue.isPriority(2)).toBe(false);
  });

  it('draws the priority page first, then pending pages', async () => {
    const queue = new PageRenderQueue();
    const drawn: number[] = [];
    queue.prioritize(9);
    queue.request(2, () => drawn.push(2));
    queue.request(9, () => drawn.push(9));
    await flushQueue();

    expect(drawn).toEqual([9]);
    queue.complete(9);
    expect(drawn).toEqual([9, 2]);
  });

  it('starts a pending page when idle even if it is not priority', async () => {
    const queue = new PageRenderQueue();
    const drawn: number[] = [];
    queue.prioritize(1);
    queue.request(2, () => drawn.push(2));
    await flushQueue();

    expect(drawn).toEqual([2]);
  });

  it('does not start another page until the running page completes', async () => {
    const queue = new PageRenderQueue();
    const drawn: number[] = [];
    queue.request(1, () => drawn.push(1));
    queue.request(2, () => drawn.push(2));
    await flushQueue();

    expect(drawn).toEqual([1]);
    queue.complete(1);
    expect(drawn).toEqual([1, 2]);
  });

  it('drops a cancelled page without drawing it', async () => {
    const queue = new PageRenderQueue();
    const drawn: number[] = [];
    queue.request(1, () => drawn.push(1));
    queue.request(2, () => drawn.push(2));
    queue.cancel(2);
    await flushQueue();
    queue.complete(1);

    expect(drawn).toEqual([1]);
  });
});
