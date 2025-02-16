import { Queue } from 'bullmq';
import waitForExpect from 'wait-for-expect';

import { Event } from 'api/common.v2/contracts/emitter/Event';
import { config } from 'api/config';

import { EmitterFactory } from '../emitter/EmitterFactory';
import { BullMQEventForwarder } from '../queue/BullMQEventForwarder';
import { BullMQWorker } from '../worker/BullMQWorker';

describe('BullMQWorker', () => {
  const emitter = EmitterFactory.createDefault();
  let bullMQEventForwarder: BullMQEventForwarder;
  const eventName = 'eventName';
  const process = jest.fn();
  let sut: BullMQWorker;

  beforeEach(async () => {
    process.mockClear();
  });

  beforeAll(async () => {
    const queue = new Queue('testingQueue', {
      connection: { host: config.redis.host, port: config.redis.port },
    });

    bullMQEventForwarder = new BullMQEventForwarder({
      emitter,
      eventName,
      queue,
    });

    sut = new BullMQWorker({
      name: bullMQEventForwarder.queue.name,
      process,
      options: { connection: { host: config.redis.host, port: config.redis.port } },
    });

    sut.start();
  });

  afterAll(async () => {
    await sut.worker.close();
    await bullMQEventForwarder.queue.close();
  });

  afterEach(async () => {
    await bullMQEventForwarder.queue.obliterate({ force: true });
  });

  it('should process an Event correctly', async () => {
    const event = new Event({ name: eventName, payload: { stringValue: 'value', numberValue: 2 } });
    emitter.emit(event);

    await waitForExpect(() => expect(process).toHaveBeenCalled());

    expect(process).toHaveBeenCalledWith(
      expect.objectContaining({
        date: event.date.toISOString(),
        name: event.name,
        payload: event.payload,
      })
    );
  });

  it('should handle multiple events', async () => {
    const event1 = new Event({ name: eventName, payload: 'payload_1' });
    const event2 = new Event({ name: eventName, payload: 'payload_2' });

    emitter.emit(event1);
    emitter.emit(event2);

    await waitForExpect(() => expect(process).toHaveBeenCalledTimes(2));
  });
});
