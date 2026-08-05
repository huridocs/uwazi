/* eslint-disable max-statements */
import testingDB from '#api/utils/testing_db.js';
import {
  fixtures,
  entity1EnId,
  entity1EsId,
  entity1DocEnId,
  entity1DocEsId,
  entity2EnId,
  entity2EsId,
  entity2DocEnId,
  entity3EnId,
  entity3FrId,
  entity3DocEsId,
  entity4EnId,
  entity4EsId,
  entity5EnId,
} from './fixtures.js';
import migration from '../index.js';

const createSut = () => ({
  ...migration,
  up: async () => migration.up(testingDB.mongodb!),
});

jest.setTimeout(30000);

describe('migration set-entity-preview', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have delta 195', () => {
    expect(createSut().delta).toBe(195);
  });

  it('should set preview to the language-matching thumbnail for each entity translation', async () => {
    await createSut().up();

    const en = await testingDB.mongodb!.collection('entities').findOne({ _id: entity1EnId });
    const es = await testingDB.mongodb!.collection('entities').findOne({ _id: entity1EsId });

    expect(en?.preview).toBe(`${entity1DocEnId.toString()}.jpg`);
    expect(es?.preview).toBe(`${entity1DocEsId.toString()}.jpg`);
  });

  it('should fall back to the default-language thumbnail when no language-specific thumbnail exists', async () => {
    await createSut().up();

    const en = await testingDB.mongodb!.collection('entities').findOne({ _id: entity2EnId });
    const es = await testingDB.mongodb!.collection('entities').findOne({ _id: entity2EsId });

    // both should get the en thumbnail since there is no es thumbnail
    expect(en?.preview).toBe(`${entity2DocEnId.toString()}.jpg`);
    expect(es?.preview).toBe(`${entity2DocEnId.toString()}.jpg`);
  });

  it('should fall back to the first available thumbnail when neither entity nor default language thumbnail exists', async () => {
    await createSut().up();

    const en = await testingDB.mongodb!.collection('entities').findOne({ _id: entity3EnId });
    const fr = await testingDB.mongodb!.collection('entities').findOne({ _id: entity3FrId });

    // only an 'es' thumbnail exists; both translations should get it
    expect(en?.preview).toBe(`${entity3DocEsId.toString()}.jpg`);
    expect(fr?.preview).toBe(`${entity3DocEsId.toString()}.jpg`);
  });

  it('should unset preview when no thumbnails exist for the entity', async () => {
    await createSut().up();

    const en = await testingDB.mongodb!.collection('entities').findOne({ _id: entity4EnId });
    const es = await testingDB.mongodb!.collection('entities').findOne({ _id: entity4EsId });

    expect(en?.preview).toBeUndefined();
    expect(es?.preview).toBeUndefined();
  });

  it('should clear stale denormalized previews when recomputation yields no preview', async () => {
    await createSut().up();

    const entity = await testingDB.mongodb!.collection('entities').findOne({ _id: entity5EnId });

    expect(entity?.preview).toBeUndefined();
  });

  it('should be idempotent — running up() twice produces the same result', async () => {
    const sut = createSut();
    await sut.up();
    await sut.up();

    const en = await testingDB.mongodb!.collection('entities').findOne({ _id: entity1EnId });
    const es = await testingDB.mongodb!.collection('entities').findOne({ _id: entity1EsId });
    const entity2En = await testingDB.mongodb!.collection('entities').findOne({ _id: entity2EnId });
    const entity4En = await testingDB.mongodb!.collection('entities').findOne({ _id: entity4EnId });
    const entity5En = await testingDB.mongodb!.collection('entities').findOne({ _id: entity5EnId });

    expect(en?.preview).toBe(`${entity1DocEnId.toString()}.jpg`);
    expect(es?.preview).toBe(`${entity1DocEsId.toString()}.jpg`);
    expect(entity2En?.preview).toBe(`${entity2DocEnId.toString()}.jpg`);
    expect(entity4En?.preview).toBeUndefined();
    expect(entity5En?.preview).toBeUndefined();
  });
});
