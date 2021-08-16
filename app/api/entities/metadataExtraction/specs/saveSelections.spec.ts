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
              label: 'Property A',
              selection: { text: 'old text of Property A' },
            },
            { label: 'Property B', selection: { text: 'unchanged text of prop B' } },
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
        selections: [{ label: 'Title', selection: { text: 'a selection for testing porpouses' } }],
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
          { label: 'Property A', selection: { text: 'newer selected text of prop A' } },
          { label: 'Property C', selection: { text: 'new selected text of prop C' } },
        ],
      },
    });
    expect(files.save).toHaveBeenCalledWith({
      _id: '61182037e1a99857d7382d47',
      extractedMetadata: [
        { label: 'Property A', selection: { text: 'newer selected text of prop A' } },
        { label: 'Property C', selection: { text: 'new selected text of prop C' } },
        { label: 'Property B', selection: { text: 'unchanged text of prop B' } },
      ],
    });
  });

  it('should remove selections if entity metadata is diferent from selected metadata', async () => {
    await saveSelections({
      _id: 'entityID',
      sharedId: 'entitySharedId',
      __extractedMetadata: {
        selections: [
          { label: 'Property A', selection: { text: 'newer selected text of prop A' } },
          { label: 'Property C', selection: { text: 'new text of prop C' } },
        ],
      },
      metadata: {
        property_a: [
          {
            value: 'diferent metadata entered manually by user',
          },
        ],
      },
    });
    expect(files.save).toHaveBeenCalledWith({
      _id: '61182037e1a99857d7382d47',
      extractedMetadata: [
        { label: 'Property C', selection: { text: 'new text of prop C' } },
        { label: 'Property B', selection: { text: 'unchanged text of prop B' } },
      ],
    });
  });
});
