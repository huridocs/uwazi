import { Semaphore } from '../Semaphore.js';

describe('Semaphore', () => {
  it('acquire() resolves immediately when permits are available', async () => {
    const sem = new Semaphore(1);
    await expect(sem.acquire()).resolves.toBeUndefined();
  });

  it('acquire() suspends when all permits are exhausted; resolves after release()', async () => {
    const sem = new Semaphore(1);
    await sem.acquire();

    let resolved = false;
    const waiting = sem.acquire().then(() => {
      resolved = true;
    });

    // Still blocked
    await Promise.resolve();
    expect(resolved).toBe(false);

    sem.release();
    await waiting;
    expect(resolved).toBe(true);
  });

  it('with permits=2, a third acquire() suspends until one existing acquire releases', async () => {
    const sem = new Semaphore(2);
    await sem.acquire(); // takes permit 1
    await sem.acquire(); // takes permit 2

    let thirdResolved = false;
    const third = sem.acquire().then(() => {
      thirdResolved = true;
    });

    await Promise.resolve();
    expect(thirdResolved).toBe(false);

    sem.release(); // returns permit — should wake the third waiter
    await third;
    expect(thirdResolved).toBe(true);
  });

  it('queue is FIFO: waiters wake in the order they called acquire()', async () => {
    const sem = new Semaphore(1);
    await sem.acquire(); // exhaust the one permit

    const order: number[] = [];
    const p1 = sem.acquire().then(() => order.push(1));
    const p2 = sem.acquire().then(() => order.push(2));
    const p3 = sem.acquire().then(() => order.push(3));

    sem.release(); // wakes p1
    await p1;
    sem.release(); // wakes p2
    await p2;
    sem.release(); // wakes p3
    await p3;

    expect(order).toEqual([1, 2, 3]);
  });

  it('throws RangeError when constructed with permits < 1', () => {
    expect(() => new Semaphore(0)).toThrow(RangeError);
    expect(() => new Semaphore(-1)).toThrow(RangeError);
  });

  it('releasing with no waiters increments permits without phantom wakeup', async () => {
    const sem = new Semaphore(1);
    await sem.acquire();
    sem.release(); // back to 1
    sem.release(); // should increment to 2, not wake anyone

    // Two immediate acquires should now both resolve without suspending
    let firstResolved = false;
    let secondResolved = false;

    sem.acquire().then(() => {
      firstResolved = true;
    });
    sem.acquire().then(() => {
      secondResolved = true;
    });

    await Promise.resolve();
    expect(firstResolved).toBe(true);
    expect(secondResolved).toBe(true);
  });
});
