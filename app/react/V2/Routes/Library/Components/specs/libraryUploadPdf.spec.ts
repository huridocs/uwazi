/**
 * @jest-environment jsdom
 */
import { waitFor } from '@testing-library/react';
import { UploadService } from '#V2/api/files/UploadService.js';
import { entityFromCreatePdfResponse, uploadChosenLibraryPdfs } from '../libraryUploadPdf.js';

jest.mock('#V2/api/files/UploadService.js', () => ({
  UploadService: jest.fn(),
}));

jest.mock('#V2/utils/notifyBridge.js', () => ({
  notify: jest.fn(),
}));

const pdf = (name: string) => new File(['%PDF'], name, { type: 'application/pdf' });

const mockUpload = (created: { data: { sharedId: string; title?: string } }[]) => {
  const upload = jest.fn().mockResolvedValue(created);
  jest.mocked(UploadService).mockImplementation((endpoint: string) => {
    expect(endpoint).toBe('createFromPDF');
    return Object.assign(Object.create(UploadService.prototype), {
      onProgress: jest.fn(),
      onUploadComplete: jest.fn(),
      upload,
    });
  });
  return upload;
};

describe('entityFromCreatePdfResponse', () => {
  it('reads the entity from create-from-pdf { data }', () => {
    expect(
      entityFromCreatePdfResponse({ data: { sharedId: 'new-1', title: 'Report.pdf' } })?.sharedId
    ).toBe('new-1');
  });
});

describe('uploadChosenLibraryPdfs', () => {
  it('creates a row for each pdf and skips other files', async () => {
    const upload = mockUpload([
      { data: { sharedId: 'pdf-a', title: 'A' } },
      { data: { sharedId: 'pdf-b', title: 'B' } },
    ]);
    const onCreated = jest.fn();
    uploadChosenLibraryPdfs(
      [pdf('a.pdf'), new File(['hello'], 'notes.txt', { type: 'text/plain' }), pdf('b.pdf')],
      onCreated
    );
    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'a.pdf' }),
        expect.objectContaining({ name: 'b.pdf' }),
      ]);
      expect(onCreated).toHaveBeenNthCalledWith(
        1,
        'pdf-a',
        expect.objectContaining({ sharedId: 'pdf-a', title: 'A' })
      );
      expect(onCreated).toHaveBeenNthCalledWith(
        2,
        'pdf-b',
        expect.objectContaining({ sharedId: 'pdf-b', title: 'B' })
      );
    });
  });
});
