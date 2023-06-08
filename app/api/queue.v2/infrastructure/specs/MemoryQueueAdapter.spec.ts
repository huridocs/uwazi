/* eslint-disable max-statements */
import { MemoryQueueAdapter } from '../MemoryQueueAdapter';

async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

it('should create queues', async () => {
  const queue = new MemoryQueueAdapter();
  await queue.createQueueAsync({ qname: 'queue1', vt: 1 });
  await queue.createQueueAsync({ qname: 'queue2', vt: 2 });

  await queue.sendMessageAsync({ qname: 'queue1', message: 'message1' });
  await queue.sendMessageAsync({ qname: 'queue2', message: 'message2' });

  expect(queue.getQueue('queue1')).toMatchObject({
    data: [{ message: 'message1' }],
  });
  expect(queue.getQueue('queue2')).toMatchObject({
    data: [{ message: 'message2' }],
  });
});

it('should throw error if creating an existing queue', async () => {
  const queue = new MemoryQueueAdapter();
  await queue.createQueueAsync({ qname: 'queue1', vt: 1 });

  await expect(async () =>
    queue.createQueueAsync({ qname: 'queue1', vt: 1 })
  ).rejects.toMatchObject({ name: 'queueExists' });
});

it('should enqueue a message, generate an id and make it visible', async () => {
  const queue = new MemoryQueueAdapter();
  await queue.createQueueAsync({ qname: 'name', vt: 1 });

  const id = await queue.sendMessageAsync({ qname: 'name', message: 'some message' });

  expect(id).toBe('1');
  expect(queue.getQueue('name').data).toMatchObject([{ id: '1', message: 'some message' }]);
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '1',
    message: 'some message',
  });
});

it('should delete a message', async () => {
  const queue = new MemoryQueueAdapter();
  await queue.createQueueAsync({ qname: 'name', vt: 1 });
  const id = await queue.sendMessageAsync({ qname: 'name', message: 'some message' });

  await queue.deleteMessageAsync({ qname: 'name', id });

  expect(queue.getQueue('name').data).toMatchObject([]);
});

it('should make a message invisible for vt seconds after receiving it once', async () => {
  const queue = new MemoryQueueAdapter();
  await queue.createQueueAsync({ qname: 'name', vt: 1 });

  await queue.sendMessageAsync({ qname: 'name', message: 'some message' });
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '1',
    message: 'some message',
  });

  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({});
  await sleep(1000);
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '1',
    message: 'some message',
  });
});

it('should make a message invisible for vt more seconds', async () => {
  const queue = new MemoryQueueAdapter();
  await queue.createQueueAsync({ qname: 'name', vt: 1 });

  await queue.sendMessageAsync({ qname: 'name', message: 'some message' });
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '1',
    message: 'some message',
  });

  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({});
  await sleep(800);
  await queue.changeMessageVisibilityAsync({ qname: 'name', id: '1', vt: 0.5 });
  await sleep(200);
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({});
  await sleep(500);
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '1',
    message: 'some message',
  });
});

it('should be first in first out', async () => {
  const queue = new MemoryQueueAdapter();
  await queue.createQueueAsync({ qname: 'name', vt: 1 });

  await queue.sendMessageAsync({ qname: 'name', message: 'first' });
  await queue.sendMessageAsync({ qname: 'name', message: 'second' });

  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '1',
    message: 'first',
  });
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '2',
    message: 'second',
  });
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({});
});

it('should return a message that is no longer invisible, and before the expected next', async () => {
  const queue = new MemoryQueueAdapter();
  await queue.createQueueAsync({ qname: 'name', vt: 1 });

  await queue.sendMessageAsync({ qname: 'name', message: 'first' });
  await queue.sendMessageAsync({ qname: 'name', message: 'second' });
  await queue.changeMessageVisibilityAsync({ qname: 'name', id: '2', vt: 2 });
  await queue.sendMessageAsync({ qname: 'name', message: 'third' });
  await queue.sendMessageAsync({ qname: 'name', message: 'fourth' });

  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '1',
    message: 'first',
  });
  await queue.deleteMessageAsync({ qname: 'name', id: '1' });
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '3',
    message: 'third',
  });
  await queue.deleteMessageAsync({ qname: 'name', id: '3' });
  await sleep(2000);
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '2',
    message: 'second',
  });
  await queue.deleteMessageAsync({ qname: 'name', id: '2' });
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({
    id: '4',
    message: 'fourth',
  });
  await queue.deleteMessageAsync({ qname: 'name', id: '4' });
  expect(await queue.receiveMessageAsync({ qname: 'name' })).toMatchObject({});
});
