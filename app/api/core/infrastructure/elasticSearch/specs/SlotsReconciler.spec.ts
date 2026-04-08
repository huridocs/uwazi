import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant';
import { MongoTemplatesDAO } from '../../mongodb/template/MongoTemplatesDAO';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';
import { MongoSlotsDAO } from '../entities/MongoSlotsDAO';
import { SlotsReconciler } from '../entities/SlotsReconciler';

const factory = getFixturesFactory();

const createSut = () => {
  const db = getConnection();
  const tenantName = 'tenant-a';
  const transactionManager = TransactionManagerFactory.default();

  const templatesDAO = new MongoTemplatesDAO({ db, transactionManager });
  const slotsDAO = new MongoSlotsDAO({ db, tenantName, transactionManager });

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

  it('assigns a slot for each property found in templates', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('my_text', 'text')]),
    ]);
    const { sut } = createSut();
    await sut.execute();

    expect(await getAssignedPropertyNames()).toEqual(['my_text']);
  });

  it('assigns slots for properties across multiple templates', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [
        factory.property('text_prop', 'text'),
        factory.property('date_prop', 'date'),
      ]),
      factory.template('template2', [factory.property('numeric_prop', 'numeric')]),
    ]);
    const { sut } = createSut();
    await sut.execute();

    expect(await getAssignedPropertyNames()).toEqual(['date_prop', 'numeric_prop', 'text_prop']);
  });

  it('deduplicates the same property name shared across multiple templates', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('shared_prop', 'text')]),
      factory.template('template2', [factory.property('shared_prop', 'text')]),
    ]);
    const { sut } = createSut();
    await sut.execute();

    expect(await getAssignedPropertyNames()).toEqual(['shared_prop']);
  });

  it('does not re-assign a property that is already in a slot', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('text_prop', 'text')]),
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
      { type: 'text', assignedTo: null },
      { $set: { assignedTo: 'obsolete_prop' } }
    );
    const { sut } = createSut();
    await sut.execute();

    expect(await getAssignedPropertyNames()).toEqual([]);
  });

  it('assigns new properties and releases old ones in a single run', async () => {
    await slotsCollection().updateOne(
      { type: 'text', assignedTo: null },
      { $set: { assignedTo: 'old_prop' } }
    );
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('new_prop', 'text')]),
    ]);
    const { sut } = createSut();
    await sut.execute();

    expect(await getAssignedPropertyNames()).toEqual(['new_prop']);
  });

  it('always increments the sentinel version, even when nothing changes', async () => {
    await templatesCollection().insertMany([
      factory.template('template1', [factory.property('text_prop', 'text')]),
    ]);
    const { sut } = createSut();

    await sut.execute();
    const versionAfterFirst = await getSentinelVersion();

    await sut.execute();
    const versionAfterSecond = await getSentinelVersion();

    expect(versionAfterSecond).toEqual(versionAfterFirst + 1);
  });
});
