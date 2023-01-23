import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { text, numeric, multiselect } from './fixtures.js';

describe('migration fix_migration_45_inherit_property', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(48);
  });

  it('should transform inherit.property to string', async () => {
    await migration.up(testingDB.mongodb);

    const [templateTwo] = await testingDB.mongodb
      .collection('templates')
      .find({ name: 'template_two' })
      .toArray();

    const [templateThree] = await testingDB.mongodb
      .collection('templates')
      .find({ name: 'template_three' })
      .toArray();

    expect(templateTwo.properties[0].inherit).toEqual({
      property: text.toString(),
      type: 'text',
    });

    expect(templateTwo.properties[1].inherit).toEqual({
      property: multiselect.toString(),
      type: 'multiselect',
    });

    expect(templateThree.properties[1].inherit).toEqual({
      property: numeric.toString(),
      type: 'numeric',
    });
  });

  it('should transform properties that have inherit: false and inheritProperty to the intended migration 45 structure', async () => {
    await migration.up(testingDB.mongodb);

    const [templateFive] = await testingDB.mongodb
      .collection('templates')
      .find({ name: 'template_five' })
      .toArray();

    const [templateSix] = await testingDB.mongodb
      .collection('templates')
      .find({ name: 'template_six' })
      .toArray();

    expect(templateFive.properties[0].inherit).not.toBeDefined();
    expect(templateFive.properties[1].inherit).not.toBeDefined();
    expect(templateSix.properties[1].inherit).not.toBeDefined();
  });
});
