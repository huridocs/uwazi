import { MemoryQueue } from '../MemoryQueue';

async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

it('should enqueue a message, generate an id and make it visible', async () => {
  const queue = new MemoryQueue(1);

  const id = await queue.sendMessageAsync({ message: 'some message' });

  expect(id).toBe('1');
  expect(queue.getQueue()).toMatchObject([{ id: '1', message: 'some message' }]);
  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '1', message: 'some message' });
});

it('should delete a message', async () => {
  const queue = new MemoryQueue(1);
  const id = await queue.sendMessageAsync({ message: 'some message' });

  await queue.deleteMessageAsync({ id });

  expect(queue.getQueue()).toMatchObject([]);
});

it('should make a message invisible for vt seconds after receiving it once', async () => {
  const queue = new MemoryQueue(1);

  await queue.sendMessageAsync({ message: 'some message' });
  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '1', message: 'some message' });

  expect(await queue.receiveMessageAsync()).toMatchObject({});
  await sleep(1000);
  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '1', message: 'some message' });
});

it('should make a message invisible for vt more seconds', async () => {
  const queue = new MemoryQueue(1);

  await queue.sendMessageAsync({ message: 'some message' });
  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '1', message: 'some message' });

  expect(await queue.receiveMessageAsync()).toMatchObject({});
  await sleep(800);
  await queue.changeMessageVisibilityAsync({ id: '1', vt: 0.5 });
  await sleep(200);
  expect(await queue.receiveMessageAsync()).toMatchObject({});
  await sleep(500);
  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '1', message: 'some message' });
});

it('should be first in first out', async () => {
  const queue = new MemoryQueue(1);

  await queue.sendMessageAsync({ message: 'first' });
  await queue.sendMessageAsync({ message: 'second' });

  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '1', message: 'first' });
  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '2', message: 'second' });
  expect(await queue.receiveMessageAsync()).toMatchObject({});
});

// eslint-disable-next-line max-statements
it('should return a message that is no longer invisible, and before the expected next', async () => {
  const queue = new MemoryQueue(1);

  await queue.sendMessageAsync({ message: 'first' });
  await queue.sendMessageAsync({ message: 'second' });
  await queue.changeMessageVisibilityAsync({ id: '2', vt: 2 });
  await queue.sendMessageAsync({ message: 'third' });
  await queue.sendMessageAsync({ message: 'fourth' });

  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '1', message: 'first' });
  await queue.deleteMessageAsync({ id: '1' });
  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '3', message: 'third' });
  await queue.deleteMessageAsync({ id: '3' });
  await sleep(2000);
  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '2', message: 'second' });
  await queue.deleteMessageAsync({ id: '2' });
  expect(await queue.receiveMessageAsync()).toMatchObject({ id: '4', message: 'fourth' });
  await queue.deleteMessageAsync({ id: '4' });
  expect(await queue.receiveMessageAsync()).toMatchObject({});
});
