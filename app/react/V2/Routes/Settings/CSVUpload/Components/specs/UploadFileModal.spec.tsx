/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { UploadFileModal } from '../UploadFileModal.js';

const renderModal = () =>
  render(
    <TestAtomStoreProvider initialValues={[[templatesAtom, []]]}>
      <UploadFileModal isOpen onClose={() => undefined} />
    </TestAtomStoreProvider>
  );

const fileOverPreviousLimit = () => {
  const file = new File(['x'], 'clips.zip', { type: 'application/zip' });
  Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 });
  return file;
};

describe('UploadFileModal', () => {
  it('accepts CSV or ZIP with no size cap', async () => {
    renderModal();

    expect(screen.getByText('CSV or ZIP')).toBeInTheDocument();

    const input = screen.getByLabelText('Browse files to upload');
    await userEvent.upload(input, fileOverPreviousLimit());

    expect(screen.getByText('clips.zip')).toBeInTheDocument();
  });
});
