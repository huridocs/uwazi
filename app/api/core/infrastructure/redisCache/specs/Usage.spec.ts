import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { RedisClient } from 'redis';
import { tenants } from 'api/tenants';
import { DataAccessObjectWithDecorator } from './DAOWithDecorator';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory';
import { RedisCacheService } from '../RedisCacheService';
import { DataSourceWithService } from './DataSourceWithService';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  templates: Array.from({ length: 20_000 }).map((_, index) =>
    factory.template(`template_${index + 1}`)
  ),
};

describe('RedisCache Usage Specs', () => {
  let redisClient: RedisClient;
  let cacheService: RedisCacheService;
  let dao: DataAccessObjectWithDecorator;
  let ds: DataSourceWithService;

  beforeAll(async () => {
    redisClient = new RedisClient({ host: 'localhost', port: 6379 });
    redisClient.on('error', console.error);

    await testingEnvironment.setUp(fixtures);

    cacheService = new RedisCacheService({ redisClient, tenants });
    dao = new DataAccessObjectWithDecorator(
      getConnection(),
      TransactionManagerFactory.default(),
      cacheService
    );
    ds = new DataSourceWithService(
      getConnection(),
      TransactionManagerFactory.default(),
      cacheService
    );
  });

  afterEach(async () => {
    await new Promise(resolve => {
      redisClient.flushdb(resolve);
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
    await new Promise(resolve => {
      redisClient.quit(resolve);
    });
  });

  describe('Decorators', () => {
    it('getAll()', async () => {
      console.time('getAll()');
      await dao.getAll(); // First call, should fetch from DB and cache
      console.timeEnd('getAll()');

      console.time('getAll() - cached');
      await dao.getAll(); // Second call, should fetch from cache
      console.timeEnd('getAll() - cached');
    });

    it('getById()', async () => {
      console.time('getById()');
      await dao.getById(factory.id('template_1').toString()); // First call, should fetch from DB and cache
      console.timeEnd('getById()');

      console.time('getById() - cached');
      await dao.getById(factory.id('template_1').toString()); // Second call, should fetch from cache
      console.timeEnd('Second call');
    });
  });

  describe('Using service directly', () => {
    it('getAll()', async () => {
      console.time('getAll()');
      await ds.getAll(); // First call, should fetch from DB and cache
      console.timeEnd('getAll()');

      console.time('getAll() - cached');
      await ds.getAll(); // Second call, should fetch from cache
      console.timeEnd('getAll() - cached');
    });

    it('getById()', async () => {
      console.time('getById()');
      await ds.getById(factory.id('template_1').toString()); // First call, should fetch from DB and cache
      console.timeEnd('getById()');

      console.time('getById() - cached');
      await ds.getById(factory.id('template_1').toString()); // Second call, should fetch from cache
      console.timeEnd('getById() - cached');
    });
  });
});
