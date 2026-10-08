/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  thesauriAtom,
  translationsAtom,
} from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { Template } from '#app/apiResponseTypes.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { LibraryMultiEdit } from '../LibraryMultiEdit.js';
import { LibrarySelectionPanel } from '../LibrarySelectionPanel.js';

jest.mock('#app/Map/MapContainer.js', () => ({
  Map: () => <div data-testid="mock-map" />,
  Layer: () => null,
}));

jest.mock('#app/Map/index.js', () => ({
  Map: () => <div data-testid="mock-map" />,
}));

const property = (name: string, label: string, type: string) => ({
  _id: name,
  name,
  label,
  type,
});

const templates = [
  {
    _id: 'case',
    name: 'Case',
    properties: [property('summary', 'Summary', 'text'), property('amount', 'Amount', 'numeric')],
  },
  {
    _id: 'country',
    name: 'Country',
    properties: [property('region', 'Region', 'text')],
  },
] as Template[];

const hit = (sharedId: string, template: string, title: string): LibrarySearchHit => ({
  _id: sharedId,
  sharedId,
  language: 'en',
  title,
  template,
});

const languages = [
  { key: 'en', label: 'English', default: true },
  { key: 'es', label: 'Spanish' },
];

const renderEdit = async (
  hits: LibrarySearchHit[],
  multipleUpdate = jest.fn().mockResolvedValue([[]])
) => {
  const onSaved = jest.fn();
  const onCancel = jest.fn();
  render(
    <TestRouterContext>
      <ServicesProvider value={createTestServices({ entities: { multipleUpdate } })}>
        <TestAtomStoreProvider
          initialValues={[
            [localeAtom, 'en'],
            [templatesAtom, templates],
            [thesauriAtom, []],
            [translationsAtom, translations],
            [settingsAtom, { languages }],
          ]}
        >
          <LibraryMultiEdit hits={hits} onCancel={onCancel} onSaved={onSaved} />
        </TestAtomStoreProvider>
      </ServicesProvider>
    </TestRouterContext>
  );
  await screen.findByTestId('library-multi-edit');
  return { multipleUpdate, onSaved, onCancel };
};

describe('LibraryMultiEdit', () => {
  it('shows one input per language for a shared text and a single control for other properties', async () => {
    await renderEdit([hit('a', 'case', 'Alpha'), hit('b', 'case', 'Beta')]);

    expect(screen.getByLabelText('Summary (English)')).toBeInTheDocument();
    expect(screen.getByLabelText('Summary (Spanish)')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Template')).toHaveValue('case');
  });

  it('shows only the template selector when no property matches', async () => {
    await renderEdit([hit('a', 'case', 'Alpha'), hit('b', 'country', 'Beta')]);

    expect(screen.queryByLabelText('Summary (English)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Region (English)')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Template')).toHaveValue('');
  });

  it('loads the chosen template fields', async () => {
    await renderEdit([hit('a', 'case', 'Alpha'), hit('b', 'country', 'Beta')]);

    fireEvent.change(screen.getByLabelText('Template'), { target: { value: 'country' } });

    expect(screen.getByLabelText('Region (English)')).toBeInTheDocument();
    expect(screen.getByLabelText('Region (Spanish)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Summary (English)')).not.toBeInTheDocument();
  });

  it('saves filled values for the active language and the other translations', async () => {
    const { multipleUpdate, onSaved } = await renderEdit([
      hit('a', 'case', 'Alpha'),
      hit('b', 'case', 'Beta'),
    ]);

    fireEvent.change(screen.getByLabelText('Summary (English)'), { target: { value: 'Hello' } });
    fireEvent.change(screen.getByLabelText('Summary (Spanish)'), { target: { value: 'Hola' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(multipleUpdate).toHaveBeenCalledTimes(1));
    expect(multipleUpdate).toHaveBeenCalledWith(
      {
        ids: ['a', 'b'],
        values: {
          metadata: {
            summary: [{ value: 'Hello' }],
            amount: [{ value: '3' }],
          },
          translations: {
            es: { summary: [{ value: 'Hola' }] },
          },
        },
      },
      { language: 'en' }
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('keeps the form open and shows the error when save fails', async () => {
    const multipleUpdate = jest
      .fn()
      .mockResolvedValue([undefined, { message: 'nope', detail: 'Nope' }]);
    const { onSaved } = await renderEdit(
      [hit('a', 'case', 'Alpha'), hit('b', 'case', 'Beta')],
      multipleUpdate
    );

    fireEvent.change(screen.getByLabelText('Summary (English)'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nope');
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByTestId('library-multi-edit')).toBeInTheDocument();
  });

  it('returns to the selection list on cancel', async () => {
    render(
      <TestRouterContext>
        <ServicesProvider value={createTestServices({ entities: { multipleUpdate: jest.fn() } })}>
          <TestAtomStoreProvider
            initialValues={[
              [localeAtom, 'en'],
              [templatesAtom, templates],
              [thesauriAtom, []],
              [translationsAtom, translations],
              [settingsAtom, { languages }],
            ]}
          >
            <LibrarySelectionPanel
              rows={[hit('a', 'case', 'Alpha'), hit('b', 'case', 'Beta')]}
              selectedIds={['a', 'b']}
              entityBasePath="/entityv2"
              onClose={jest.fn()}
              onRemove={jest.fn()}
              onPreview={jest.fn()}
            />
          </TestAtomStoreProvider>
        </ServicesProvider>
      </TestRouterContext>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(screen.getByTestId('library-multi-edit')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('library-multi-edit')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});
