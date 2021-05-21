import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { text, multiselect, numeric } from './fixtures.js';

describe('migration denormalize-inherited-type', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(41);
  });

  it('should denormalize the inherited type', async () => {
    await migration.up(testingDB.mongodb);

    const [template_two] = await testingDB.mongodb
      .collection('templates')
      .find({ name: 'template_two' })
      .toArray();

    const [template_three] = await testingDB.mongodb
      .collection('templates')
      .find({ name: 'template_three' })
      .toArray();

    expect(template_two.properties[0].inherit.type).toBe('text');
    expect(template_two.properties[0].inherit.property).toEqual(text);
    expect(template_two.properties[0].inheritProperty).not.toBeDefined();

    expect(template_two.properties[1].inherit.type).toBe('multiselect');
    expect(template_two.properties[1].inherit.property).toEqual(multiselect);
    expect(template_two.properties[1].inheritProperty).not.toBeDefined();

    expect(template_three.properties[1].inherit.type).toBe('numeric');
    expect(template_three.properties[1].inherit.property).toEqual(numeric);
    expect(template_three.properties[1].inheritProperty).not.toBeDefined();
  });
});
