import { testingDB } from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration remove_id_and_localID_from_template', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(63);
  });

  it('should remove localID and id from template properties', async () => {
    await migration.up(testingDB.mongodb);

    const templates = await testingDB.mongodb.collection('templates').find().toArray();

    templates.forEach(template => {
      if (template.properties) {
        template.properties.forEach(property => {
          expect(property.id).toBe(undefined);
          expect(property.localID).toBe(undefined);
        });
      }
    });

    const sanitizedTemplateWithId = templates[0];
    expect(sanitizedTemplateWithId.properties).toMatchObject([
      {
        nestedProperties: [],
        label: 'Text property 1',
        type: 'text',
        name: 'text_property_1',
      },
      {
        nestedProperties: [],
        relationType: '5ab249565771f9ee361459f4',
        label: 'Related',
        type: 'relationship',
        content: '58ada34c299e826748545059',
        filter: true,
        name: 'related',
      },
    ]);

    const sanitizedTemplateWithLocalId = templates[1];
    expect(sanitizedTemplateWithLocalId.properties).toMatchObject([
      {
        nestedProperties: [],
        relationType: '5ab249575771f9ee36145a24',
        label: 'Related',
        type: 'relationship',
        content: '58ada34c299e82674854504b',
        filter: true,
        name: 'related',
      },
      {
        nestedProperties: [],
        label: 'Type',
        type: 'multiselect',
        filter: true,
        content: '58ada34c299e8267485450fb',
        name: 'type',
      },
      {
        label: 'Markdown',
        type: 'markdown',
        name: 'markdown',
      },
    ]);

    const sanitizedTemplateWithNoProps = templates[4];
    expect(sanitizedTemplateWithNoProps.properties.length).toBe(0);
  });
});
