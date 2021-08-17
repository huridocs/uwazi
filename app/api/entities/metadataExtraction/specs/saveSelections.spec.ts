import { files } from 'api/files';
import { testingDB } from 'api/utils/testing_db';
import { saveSelections } from '../saveSelections';

describe('saveSelections', () => {
  jest.spyOn(files, 'save');

  beforeEach(async () => {
    await testingDB.clearAllAndLoad({
      files: [
        {
          _id: '61182037e1a99857d7382d47',
          filename: '1628971063058z11sx28u0j.pdf',
          entity: 'entitySharedId',
          type: 'document',
          extractedMetadata: [
            {
              name: 'property_a',
              selection: { text: 'old text of Property A' },
            },
            { name: 'property_b', selection: { text: 'unchanged text of prop B' } },
          ],
        },
        {
          _id: '23467234678sdf236784234678',
          filename: 'aFile.pdf',
          entity: 'anotherEntity',
          type: 'document',
        },
      ],
    });
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should not call save if entity has no main file', async () => {
    await saveSelections({
      sharedId: 'entityWithNoFile',
      __extractedMetadata: {
        selections: [{ name: 'Title', selection: { text: 'a selection for testing porpouses' } }],
      },
    });
    expect(files.save).not.toHaveBeenCalled();
  });

  it('should not call save if entity has file, but there is not extracted metadata', async () => {
    await saveSelections({
      sharedId: 'anotherEntity',
      __extractedMetadata: { selections: [] },
    });
    expect(files.save).not.toHaveBeenCalled();
  });

  it('should update selections stored in the file with the newer ones', async () => {
    await saveSelections({
      _id: 'entityID',
      sharedId: 'entitySharedId',
      __extractedMetadata: {
        selections: [
          { name: 'property_a', selection: { text: 'newer selected text of prop A' } },
          { name: 'property_c', selection: { text: 'new selected text of prop C' } },
        ],
      },
      metadata: {
        property_a: [
          {
            value: 'newer selected text of prop A',
          },
        ],
        property_b: [
          {
            value: 'unchanged text of prop B',
          },
        ],
        property_c: [
          {
            value: 'new selected text of prop C',
          },
        ],
      },
    });
    expect(files.save).toHaveBeenCalledWith({
      _id: '61182037e1a99857d7382d47',
      extractedMetadata: [
        { name: 'property_a', selection: { text: 'newer selected text of prop A' } },
        { name: 'property_c', selection: { text: 'new selected text of prop C' } },
        { name: 'property_b', selection: { text: 'unchanged text of prop B' } },
      ],
    });
  });

  it('should remove selections if entity metadata is diferent from selected metadata', async () => {
    await saveSelections({
      _id: 'entityID',
      sharedId: 'entitySharedId',
      __extractedMetadata: {
        selections: [
          { name: 'property_a', selection: { text: 'newer selected text of prop A' } },
          { name: 'property_c', selection: { text: 'new text of prop C' } },
        ],
      },
      metadata: {
        property_a: [
          {
            value: 'diferent text entered manually by user',
          },
        ],
        property_b: [
          {
            value: 'unchanged text of prop B',
          },
        ],
        property_c: [
          {
            value: 'new text of prop C',
          },
        ],
      },
    });
    expect(files.save).toHaveBeenCalledWith({
      _id: '61182037e1a99857d7382d47',
      extractedMetadata: [
        { name: 'property_c', selection: { text: 'new text of prop C' } },
        { name: 'property_b', selection: { text: 'unchanged text of prop B' } },
      ],
    });
  });

  it('should work with numeric and date values, removing them from extracted metadata if they are diferent in the entity', async () => {
    await saveSelections({
      _id: 'entityID',
      sharedId: 'entitySharedId',
      __extractedMetadata: {
        selections: [
          { name: 'numeric_property_a', selection: { text: '122547899' } },
          { name: 'date_property_b', selection: { text: '-4733596800' } },
        ],
      },
      metadata: {
        numeric_property_a: [
          {
            value: '45',
          },
        ],
        date_property_b: [
          {
            value: '-4733596800',
          },
        ],
        property_a: [
          {
            value: 'old text of Property A',
          },
        ],
        property_b: [
          {
            value: 'unchanged text of prop B',
          },
        ],
      },
    });
    expect(files.save).toHaveBeenCalledWith({
      _id: '61182037e1a99857d7382d47',
      extractedMetadata: [
        { name: 'date_property_b', selection: { text: '-4733596800' } },
        { name: 'property_a', selection: { text: 'old text of Property A' } },
        { name: 'property_b', selection: { text: 'unchanged text of prop B' } },
      ],
    });
  });
});
