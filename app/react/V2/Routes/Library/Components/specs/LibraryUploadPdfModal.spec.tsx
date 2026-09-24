/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { UploadService } from '#V2/api/files/UploadService.js';
import { LibraryUploadPdfModal } from '../LibraryUploadPdfModal.js';

jest.mock('#V2/api/files/UploadService.js', () => ({
  UploadService: jest.fn(),
}));

const renderModal = (onUploaded = jest.fn(), onClose = jest.fn()) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [translationsAtom, translations],
      ]}
    >
      <LibraryUploadPdfModal onClose={onClose} onUploaded={onUploaded} />
    </TestAtomStoreProvider>
  );

describe('LibraryUploadPdfModal', () => {
  it('uploads selected PDFs through create-from-pdf', async () => {
    const upload = jest.fn().mockResolvedValue([{ data: { sharedId: 'pdf-entity' } }]);
    const onProgress = jest.fn();
    const onUploadComplete = jest.fn();
    (UploadService as unknown as jest.Mock).mockImplementation((endpoint: string) => {
      expect(endpoint).toBe('createFromPDF');
      return { onProgress, onUploadComplete, upload };
    });
    const onUploaded = jest.fn();
    renderModal(onUploaded);

    const pdf = new File(['%PDF'], 'judgment.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Choose PDF files'), { target: { files: [pdf] } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith([pdf]);
      expect(onUploaded).toHaveBeenCalledWith('pdf-entity');
    });
  });
});
