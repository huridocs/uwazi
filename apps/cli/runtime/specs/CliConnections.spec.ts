import { Redis } from '#api/infrastructure/Redis.js';
import { DB } from '#api/odm/index.js';
import { CliConnections } from '../CliConnections.js';

const MONGOOSE_CONNECTED = 1;
const MONGOOSE_DISCONNECTED = 0;

describe('CliConnections', () => {
  afterEach(async () => {
    await CliConnections.close();
  });

  it('should open MongoDB and leave Redis closed when not needed', async () => {
    await CliConnections.open({ redis: false });

    expect(DB.getConnection().readyState).toBe(MONGOOSE_CONNECTED);
    expect(Redis.redisClient).toBeUndefined();
  });

  it('should open Redis when needed', async () => {
    await CliConnections.open({ redis: true });

    expect(Redis.redisClient).toEqual(expect.objectContaining({ connected: true }));
  });

  it('should close every connection', async () => {
    await CliConnections.open({ redis: true });

    await CliConnections.close();

    expect(DB.getConnection().readyState).toBe(MONGOOSE_DISCONNECTED);
    expect((Redis.redisClient as { connected?: boolean } | undefined)?.connected).toBeFalsy();
  });
});
