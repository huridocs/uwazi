/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AddFileModal } from '../AddFileModal.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

const mockState = {
  pendingAddFiles: [new File(['x'], 'a.txt', { type: 'text/plain' })],
  addFileMode: 'main' as const,
  closeAddFileModal: jest.fn(),
  confirmAddFile: () => new Promise<number>(() => {}),
  openAddFilePicker: jest.fn(),
  acceptSelectedFiles: jest.fn(),
  removePendingAddFile: jest.fn(),
  defaultLanguageKey: 'en',
  uploadProgress: 10,
};

jest.mock('../EntityFilesContext', () => ({
  useEntityFiles: () => mockState,
}));

describe('AddFileModal', () => {
  it('disables the file picker while a batch is uploading', () => {
    render(<AddFileModal />);
    fireEvent.click(screen.getByRole('button', { name: 'Add file' }));
    expect(screen.getByRole('button', { name: /Click to select files/ })).toBeDisabled();
  });
});
