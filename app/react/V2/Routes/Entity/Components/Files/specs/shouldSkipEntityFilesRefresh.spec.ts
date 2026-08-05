import { shouldSkipEntityFilesRefresh } from '../shouldSkipEntityFilesRefresh.js';

describe('shouldSkipEntityFilesRefresh', () => {
  it('skips when file is being edited', () => {
    expect(
      shouldSkipEntityFilesRefresh({
        isFileEditing: true,
        isMetadataEditing: false,
        isMetadataDirty: false,
      })
    ).toBe(true);
  });

  it('skips when metadata is being edited', () => {
    expect(
      shouldSkipEntityFilesRefresh({
        isFileEditing: false,
        isMetadataEditing: true,
        isMetadataDirty: false,
      })
    ).toBe(true);
  });

  it('skips when metadata is dirty', () => {
    expect(
      shouldSkipEntityFilesRefresh({
        isFileEditing: false,
        isMetadataEditing: false,
        isMetadataDirty: true,
      })
    ).toBe(true);
  });

  it('allows refresh when idle', () => {
    expect(
      shouldSkipEntityFilesRefresh({
        isFileEditing: false,
        isMetadataEditing: false,
        isMetadataDirty: false,
      })
    ).toBe(false);
  });
});
