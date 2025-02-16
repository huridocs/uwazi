import { Queue } from 'bullmq';

import { Event } from 'api/common.v2/contracts/emitter/Event';
import { Emitter } from 'api/common.v2/contracts/emitter/Emitter';

import { BullMQEventForwarder } from '../queue/BullMQEventForwarder';
import { EmitterFactory } from '../emitter/EmitterFactory';

describe('BullMQEventForwarder', () => {
  let emitter: Emitter;
  let bullMQEventForwarder: BullMQEventForwarder;
  let queue: Queue;
  const eventName = 'testEvent';

  beforeEach(() => {
    queue = new Queue('testQueue');
    emitter = EmitterFactory.createDefault();
    bullMQEventForwarder = new BullMQEventForwarder({ queue, emitter, eventName });
  });

  afterEach(async () => {
    await bullMQEventForwarder.queue.obliterate({ force: true });
    await bullMQEventForwarder.queue.close();
  });

  it('should listen to the event and enqueue it', async () => {
    const event = new Event({ name: eventName, payload: { value: 'a value' } });

    Array(100)
      .fill(1)
      .forEach(_ => emitter.emit(event));

    const jobs = await bullMQEventForwarder.queue.getJobs();

    expect(jobs).toHaveLength(100);
    expect(jobs[0].data).toEqual(JSON.stringify(event));
  });

  it('should not enqueue events with different names', async () => {
    const event = new Event({ name: 'differentEvent', payload: { value: 'a value' } });

    emitter.emit(event);

    const jobs = await bullMQEventForwarder.queue.getJobs();

    expect(jobs).toHaveLength(0);
  });

  it('should handle multiple different events correctly', async () => {
    const event1 = new Event({ name: eventName, payload: 'any_payload' });
    const event2 = new Event({ name: eventName, payload: { value: 'value2' } });

    emitter.emit(event1);
    emitter.emit(event2);

    const jobs = await bullMQEventForwarder.queue.getJobs();

    expect(jobs).toHaveLength(2);
    expect(jobs[0].data).toBe(JSON.stringify(event2));
    expect(jobs[1].data).toBe(JSON.stringify(event1));
  });
});
