/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { localeAtom, templatesAtom, thesauriAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import { LibraryCreateEntityPanel } from '../LibraryCreateEntityPanel.js';

const renderPanel = (upsert: jest.Mock, onCreated = jest.fn(), onClose = jest.fn()) =>
  render(
    <ServicesProvider value={createTestServices({ entities: { upsert } })}>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [thesauriAtom, []],
          [translationsAtom, translations],
        ]}
      >
        <LibraryCreateEntityPanel onClose={onClose} onCreated={onCreated} />
      </TestAtomStoreProvider>
    </ServicesProvider>
  );

const expectEmptyCreateForm = () => {
  expect(screen.getByTestId('library-create-entity')).toBeInTheDocument();
  expect(screen.getByText('New entity')).toBeInTheDocument();
  expect(screen.getByLabelText(/Title/)).toHaveValue('');
};

const expectCreatedPayload = (upsert: jest.Mock, onCreated: jest.Mock) => {
  const [[payload]] = upsert.mock.calls;
  expect(payload._id).toBeUndefined();
  expect(payload.sharedId).toBeUndefined();
  expect(payload.title).toBe('Paella');
  expect(onCreated).toHaveBeenCalledWith('created-1');
};

describe('LibraryCreateEntityPanel', () => {
  it('saves a new entity without an existing id and selects it', async () => {
    const upsert = jest.fn().mockResolvedValue([
      {
        _id: 'n1',
        sharedId: 'created-1',
        title: 'Paella',
        template: 'template1',
        language: 'en',
        creationDate: 1,
        user: 'u1',
      },
      undefined,
    ]);
    const onCreated = jest.fn();
    renderPanel(upsert, onCreated);
    expectEmptyCreateForm();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Paella' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(upsert).toHaveBeenCalled();
    });
    expectCreatedPayload(upsert, onCreated);
  });
});
