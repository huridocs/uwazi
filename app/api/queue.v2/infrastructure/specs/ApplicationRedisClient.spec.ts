import EventEmitter from 'events';
// eslint-disable-next-line camelcase
import { ApplicationRedisClient, TESTING_clean } from '../ApplicationRedisClient';

const clientMock = new EventEmitter();
// @ts-ignore
clientMock.quit = () => true;

const createClientMock = jest.fn().mockReturnValue(clientMock);

beforeEach(() => {
  TESTING_clean();
  clientMock.removeAllListeners();
  createClientMock.mockClear();
});

it('should only call createClient once if many requests request an instance concurrently', done => {
  Promise.all([
    ApplicationRedisClient.getInstance(createClientMock),
    ApplicationRedisClient.getInstance(createClientMock),
    ApplicationRedisClient.getInstance(createClientMock),
    ApplicationRedisClient.getInstance(createClientMock),
    ApplicationRedisClient.getInstance(createClientMock),
  ])
    .then(([r1, r2, r3, r4, r5]) => {
      expect(createClientMock.mock.calls.length).toBe(1);
      expect(r1).toBe(r2);
      expect(r1).toBe(r3);
      expect(r1).toBe(r4);
      expect(r1).toBe(r5);
      expect(r1).toBe(clientMock);
      done();
    })
    .catch(done);

  clientMock.emit('ready');
});

it('should throw an error if the creation throws', done => {
  const promise = ApplicationRedisClient.getInstance(createClientMock);
  promise
    .then(() => {
      throw new Error('should have failed');
    })
    .catch(e => {
      expect(e).toBe('some error');
      done();
    });

  clientMock.emit('error', 'some error');
});

it('should close and return true if there was a connection', async () => {
  const promise = ApplicationRedisClient.getInstance(createClientMock);
  clientMock.emit('ready');
  await promise;

  const result = await ApplicationRedisClient.close();
  expect(result).toBe(true);
});

it('should return false if there was no connection', async () => {
  const result = await ApplicationRedisClient.close();
  expect(result).toBe(false);
});
