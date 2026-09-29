import { entityFromCreatePdfResponse } from '../libraryUploadPdf.js';

describe('entityFromCreatePdfResponse', () => {
  it('reads the entity from create-from-pdf { data }', () => {
    expect(
      entityFromCreatePdfResponse({ data: { sharedId: 'new-1', title: 'Report.pdf' } })?.sharedId
    ).toBe('new-1');
  });
});
