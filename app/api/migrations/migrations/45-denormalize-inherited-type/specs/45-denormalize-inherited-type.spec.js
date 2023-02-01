import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { text, multiselect, numeric } from './fixtures.js';

describe('migration denormalize-inherited-type', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(45);
  });

  it('should denormalize the inherited type', async () => {
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
      property: text,
      type: 'text',
    });
    expect(templateTwo.properties[0].inheritProperty).not.toBeDefined();

    expect(templateTwo.properties[1].inherit).toEqual({
      property: multiselect,
      type: 'multiselect',
    });
    expect(templateTwo.properties[1].inheritProperty).not.toBeDefined();

    expect(templateThree.properties[1].inherit).toEqual({
      property: numeric,
      type: 'numeric',
    });
    expect(templateThree.properties[1].inheritProperty).not.toBeDefined();
  });
});
