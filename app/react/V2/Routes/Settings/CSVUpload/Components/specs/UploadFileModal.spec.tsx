/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { templatesAtom } from '#V2/atoms/index.js';
import type { Template } from '#app/apiResponseTypes.js';
import { UploadFileModal } from '../UploadFileModal.js';

const unsortedTemplates = [
  { _id: 'zeta', name: 'Zeta' },
  { _id: 'apple', name: 'Apple' },
  { _id: 'mango', name: 'Mango' },
] as Template[];

const renderModal = (templates: Template[] = []) =>
  render(
    <TestAtomStoreProvider initialValues={[[templatesAtom, templates]]}>
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

  it('lists templates alphabetically and does not preselect one', () => {
    renderModal(unsortedTemplates);

    const select = screen.getByLabelText('Template');
    expect(select).toHaveValue('');
    expect(
      within(select)
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual(['Select template…', 'Apple', 'Mango', 'Zeta']);
  });

  it('keeps Accept disabled until a file and a template are chosen', async () => {
    renderModal(unsortedTemplates);

    const accept = screen.getByRole('button', { name: 'Accept' });
    expect(accept).toBeDisabled();

    await userEvent.upload(
      screen.getByLabelText('Browse files to upload'),
      new File(['a,b'], 'rows.csv', { type: 'text/csv' })
    );
    await screen.findByText('rows.csv');
    await waitFor(() => expect(accept).toBeDisabled());

    await userEvent.selectOptions(screen.getByLabelText('Template'), 'mango');
    expect(accept).toBeEnabled();
  });
});
