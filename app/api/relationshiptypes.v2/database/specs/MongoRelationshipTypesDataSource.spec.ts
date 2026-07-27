/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoRelationshipTypesDataSource } from '../MongoRelationshipTypesDataSource.js';

const factory = getFixturesFactory();

const fixtures = {
  relationtypes: [
    { _id: factory.id('rel1'), name: 'Rel 1', properties: [] },
    { _id: factory.id('rel2'), name: 'Rel 2', properties: [] },
  ],
};

const createSut = () => {
  const db = getConnection();
  const transactionManager = TransactionManagerFactory.default();
  const sut = new MongoRelationshipTypesDataSource(db, transactionManager);
  return { sut, transactionManager };
};

describe('MongoRelationshipTypesDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should get all relation types', async () => {
    const { sut } = createSut();
    const result = await sut.getAll();

    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(expect.arrayContaining(['Rel 1', 'Rel 2']));
  });

  it('should get by id', async () => {
    const { sut } = createSut();
    const result = await sut.getById(factory.id('rel1').toHexString());

    expect(result?.name).toBe('Rel 1');
  });

  it('should create', async () => {
    const { sut } = createSut();
    const created = await sut.create({ name: 'Rel 3' });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Rel 3');
  });

  it('should update', async () => {
    const { sut } = createSut();
    const updated = await sut.update({
      id: factory.id('rel1').toHexString(),
      name: 'Rel 1 Updated',
    });

    expect(updated.id).toBe(factory.id('rel1').toHexString());
    expect(updated.name).toBe('Rel 1 Updated');
  });

  it('should delete', async () => {
    const { sut } = createSut();
    await sut.delete(factory.id('rel1').toHexString());
    const result = await sut.getById(factory.id('rel1').toHexString());

    expect(result).toBeNull();
  });

  it('should validate existence by name', async () => {
    const { sut } = createSut();

    expect(await sut.existsByName('rel 1')).toBe(true);
    expect(await sut.existsByName('REL 1', factory.id('rel1').toHexString())).toBe(false);
    expect(await sut.existsByName('unknown')).toBe(false);
  });

  it('should validate typesExist', async () => {
    const { sut } = createSut();
    const exists = await sut.typesExist([
      factory.id('rel1').toHexString(),
      factory.id('rel2').toHexString(),
    ]);
    const missing = await sut.typesExist([
      factory.id('rel1').toHexString(),
      new ObjectId().toHexString(),
    ]);

    expect(exists).toBe(true);
    expect(missing).toBe(false);
  });

  it('should return relationship type ids', async () => {
    const { sut } = createSut();
    const ids = await sut.getRelationshipTypeIds();

    expect(ids).toEqual(
      expect.arrayContaining([factory.id('rel1').toHexString(), factory.id('rel2').toHexString()])
    );
  });

  it('should get by ids result set', async () => {
    const { sut } = createSut();
    const items = await sut
      .getByIds([factory.id('rel1').toHexString(), factory.id('rel2').toHexString()])
      .all();

    expect(items).toHaveLength(2);
    expect(items.map(i => i.name)).toEqual(expect.arrayContaining(['Rel 1', 'Rel 2']));
  });
});
