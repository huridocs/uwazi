import { Redis } from '#api/infrastructure/Redis.js';
import { elasticClient } from '#api/search/elastic.js';
import { DB } from '#api/odm/index.js';
import { CliConnections } from '../CliConnections.js';

const MONGOOSE_CONNECTED = 1;
const MONGOOSE_DISCONNECTED = 0;

describe('CliConnections', () => {
  afterEach(async () => {
    await CliConnections.close();
    jest.restoreAllMocks();
  });

  it('should open MongoDB and leave Redis closed when not needed', async () => {
    await CliConnections.open({ redis: false, elasticsearch: false });

    expect(DB.getConnection().readyState).toBe(MONGOOSE_CONNECTED);
    expect(Redis.redisClient).toBeUndefined();
  });

  it('should open Redis when needed', async () => {
    await CliConnections.open({ redis: true, elasticsearch: false });

    expect(Redis.redisClient).toEqual(expect.objectContaining({ connected: true }));
  });

  it('should close every connection', async () => {
    await CliConnections.open({ redis: true, elasticsearch: false });

    await CliConnections.close();

    expect(DB.getConnection().readyState).toBe(MONGOOSE_DISCONNECTED);
    expect((Redis.redisClient as { connected?: boolean } | undefined)?.connected).toBeFalsy();
  });

  it('should close the Elasticsearch client when the command needed it', async () => {
    const close = jest.spyOn(elasticClient, 'close');

    await CliConnections.open({ redis: false, elasticsearch: true });
    await CliConnections.close();

    expect(close).toHaveBeenCalled();
  });

  it('should leave the Elasticsearch client alone when the command did not need it', async () => {
    const close = jest.spyOn(elasticClient, 'close');

    await CliConnections.open({ redis: false, elasticsearch: false });
    await CliConnections.close();

    expect(close).not.toHaveBeenCalled();
  });
});
