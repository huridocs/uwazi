import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTemplatesDAO } from '../../mongodb/template/MongoTemplatesDAO.js';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';
import { MongoSlotsDAO } from '../entities/MongoSlotsDAO.js';
import { SlotsReconciler } from '../entities/SlotsReconciler.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';

const factory = getFixturesFactory();

const createSut = (languageKeys: LanguageISO6391[] = ['en']) => {
  const db = getConnection();
  const tenantName = 'tenant-a';
  const transactionManager = TransactionManagerFactory.default();

  const templatesDAO = new MongoTemplatesDAO({ db, transactionManager });
  const slotsDAO = new MongoSlotsDAO({
    db,
    tenantName,
    transactionManager,
    settingsDS: TestUtils.mockClass<SettingsDataSource>({
      getInstalledLanguages: async () => languageKeys.map(key => ({ key, label: key })),
    }),
  });

  const sut = new SlotsReconciler({ slotsDAO, templatesDAO });

  const originalExecute = sut.execute.bind(sut);
  sut.execute = async () => transactionManager.run(originalExecute);

  return { sut, templatesDAO, slotsDAO };
};

const slotsCollection = () => getConnection().collection(MongoSlotsDAO.collectionName);
const templatesCollection = () => getConnection().collection('templates');

const getAssignedPropertyNames = async () => {
  const docs = await slotsCollection()
    .find({ assignedTo: { $ne: null } })
    .toArray();
  return (docs.map(d => d.assignedTo) as string[]).sort();
};

const getSentinelVersion = async () => {
  const doc = await slotsCollection().findOne({ _id: MongoSlotsDAO.sentinelId });
  return (doc as any)?.version as number;
};

describe('SlotsReconciler', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => {
    const bootstrapper = new MongoSlotsBootstrapper({ database: getConnection() });
    await testingEnvironment.setFixtures({
      templates: [],
      [MongoSlotsDAO.collectionName]: [],
    });
    await bootstrapper.execute();
    MongoSlotsDAO.clearCache();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('always assigns a slot for title, even without template properties', async () => {
    const { sut } = createSut();
    await sut.execute();

    expect(await getAssignedPropertyNames()).toContain('title');
  });

  it('assigns a slot for each filterable property found in templates', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('my_text', 'text', { filter: true })]),
    ]);
    const { sut } = createSut();
    await sut.execute();

    expect(await getAssignedPropertyNames()).toEqual(['my_text', 'title']);
  });

  it('does not assign a slot for properties without filter: true', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [
        factory.property('filterable_prop', 'text', { filter: true }),
        factory.property('non_filterable', 'text', { filter: false }),
        factory.property('no_filter_flag', 'text'),
      ]),
    ]);
    const { sut } = createSut();
    await sut.execute();

    const assigned = await getAssignedPropertyNames();
    expect(assigned).toContain('filterable_prop');
    expect(assigned).toContain('title');
    expect(assigned).not.toContain('non_filterable');
    expect(assigned).not.toContain('no_filter_flag');
  });

  it('assigns slots for filterable properties across multiple templates', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [
        factory.property('text_prop', 'text', { filter: true }),
        factory.property('date_prop', 'date', { filter: true }),
      ]),
      factory.template('template2', [
        factory.property('numeric_prop', 'numeric', { filter: true }),
      ]),
    ]);
    const { sut } = createSut();
    await sut.execute();

    expect(await getAssignedPropertyNames()).toEqual([
      'date_prop',
      'numeric_prop',
      'text_prop',
      'title',
    ]);
  });

  it('deduplicates the same property name shared across multiple templates', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('shared_prop', 'text', { filter: true })]),
      factory.template('template2', [factory.property('shared_prop', 'text', { filter: true })]),
    ]);
    const { sut } = createSut();
    await sut.execute();

    expect(await getAssignedPropertyNames()).toEqual(['shared_prop', 'title']);
  });

  it('does not re-assign a property that is already in a slot', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('text_prop', 'text', { filter: true })]),
    ]);
    const { sut } = createSut();

    await sut.execute();
    const firstAssignment = await slotsCollection().findOne({ assignedTo: 'text_prop' });

    await sut.execute();
    const secondAssignment = await slotsCollection().findOne({ assignedTo: 'text_prop' });

    expect(secondAssignment).toEqual(firstAssignment);
  });

  it('releases a slot when the property is no longer present in any template', async () => {
    await slotsCollection().updateOne(
      { type: 'txt', assignedTo: null },
      { $set: { assignedTo: 'obsolete_prop' } }
    );
    const { sut } = createSut();
    await sut.execute();

    const assigned = await getAssignedPropertyNames();
    expect(assigned).not.toContain('obsolete_prop');
    expect(assigned).toContain('title');
  });

  it('assigns new properties and releases old ones in a single run', async () => {
    await slotsCollection().updateOne(
      { type: 'txt', assignedTo: null },
      { $set: { assignedTo: 'old_prop' } }
    );
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('new_prop', 'text', { filter: true })]),
    ]);
    const { sut } = createSut();
    await sut.execute();

    const assigned = await getAssignedPropertyNames();
    expect(assigned).toContain('new_prop');
    expect(assigned).toContain('title');
    expect(assigned).not.toContain('old_prop');
  });

  it('does not assign a slot for properties with an unsupported type', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [
        factory.property('image_prop', 'image', { filter: true }),
        factory.property('media_prop', 'media', { filter: true }),
      ]),
    ]);
    const { sut } = createSut();

    await expect(sut.execute()).resolves.not.toThrow();

    const assigned = await getAssignedPropertyNames();
    expect(assigned).not.toContain('image_prop');
    expect(assigned).not.toContain('media_prop');
    expect(assigned).toContain('title');
  });

  it('always increments the sentinel version, even when nothing changes', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('text_prop', 'text', { filter: true })]),
    ]);
    const { sut } = createSut();

    await sut.execute();
    const versionAfterFirst = await getSentinelVersion();

    await sut.execute();
    const versionAfterSecond = await getSentinelVersion();

    expect(versionAfterSecond).toEqual(versionAfterFirst + 1);
  });

  it('assigns new language slots for translatable properties on reconcile', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('text_prop', 'text', { filter: true })]),
    ]);

    const { sut: sutEn } = createSut(['en']);
    await sutEn.execute();

    MongoSlotsDAO.clearCache();

    const { sut: sutEnPt } = createSut(['en', 'pt']);
    await sutEnPt.execute();

    const textPropSlots = await slotsCollection().find({ assignedTo: 'text_prop' }).toArray();
    expect(textPropSlots).toHaveLength(2);
    expect(textPropSlots.map(s => s.language)).toEqual(expect.arrayContaining(['en', 'pt']));
  });

  it('releases stale language slots for translatable properties on reconcile', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('text_prop', 'text', { filter: true })]),
    ]);

    const { sut: sutEnPt } = createSut(['en', 'pt']);
    await sutEnPt.execute();

    MongoSlotsDAO.clearCache();

    const { sut: sutEn } = createSut(['en']);
    await sutEn.execute();

    const textPropSlots = await slotsCollection().find({ assignedTo: 'text_prop' }).toArray();
    expect(textPropSlots).toHaveLength(1);
    expect(textPropSlots[0].language).toBe('en');
  });
});
