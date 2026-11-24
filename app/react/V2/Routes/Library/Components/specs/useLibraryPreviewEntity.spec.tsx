/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useSetAtom } from 'jotai';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { libraryEntityRevisionAtom, localeAtom } from '#V2/atoms/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { useLibraryPreviewEntity } from '../useLibraryPreviewEntity.js';

const sharedId = 'shared-doc';

const entityWithoutFile: Entity = {
  _id: 'ent1',
  sharedId,
  language: 'en',
  title: 'Case',
  template: 'template1',
  creationDate: 0,
  user: 'user1',
  documents: [],
  attachments: [],
};

const entityWithFile: Entity = {
  ...entityWithoutFile,
  documents: [{ filename: 'file.pdf', _id: 'doc1', language: 'eng' }],
};

const pendingSpanish = {
  sharedId,
  translations: { es: { title: [{ value: '(AI translation pending) Hola' }] } },
};

const spanishTitle = (entity: Entity) => {
  const value = entity.translations?.es?.title?.[0]?.value;
  return typeof value === 'string' ? value : '';
};

const PreviewProbe = () => {
  const setRevision = useSetAtom(libraryEntityRevisionAtom);
  const { entity, loading, error, reload } = useLibraryPreviewEntity(sharedId);
  if (loading) return <div>Loading</div>;
  if (error || !entity) return <div>Missing</div>;
  return (
    <div>
      <span data-testid="file-count">{entity.documents?.length ?? 0}</span>
      <span data-testid="es-title">{spanishTitle(entity)}</span>
      <button
        type="button"
        onClick={() => {
          reload().catch(() => undefined);
        }}
      >
        Reload
      </button>
      <button type="button" onClick={() => setRevision(pendingSpanish)}>
        Record
      </button>
    </div>
  );
};

describe('useLibraryPreviewEntity', () => {
  let getBySharedId: jest.Mock;

  beforeEach(() => {
    getBySharedId = jest.fn().mockResolvedValue([[entityWithoutFile]]);
  });

  const renderHookView = (recorded?: typeof pendingSpanish) =>
    render(
      <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
        <TestAtomStoreProvider
          initialValues={
            recorded
              ? [
                  [localeAtom, 'en'],
                  [libraryEntityRevisionAtom, recorded],
                ]
              : [[localeAtom, 'en']]
          }
        >
          <PreviewProbe />
        </TestAtomStoreProvider>
      </ServicesProvider>
    );

  it('reloads the entity without unmounting the preview', async () => {
    renderHookView();
    expect(await screen.findByTestId('file-count')).toHaveTextContent('0');
    expect(getBySharedId).toHaveBeenCalledTimes(1);

    getBySharedId.mockResolvedValue([[entityWithFile]]);
    await act(async () => {
      screen.getByRole('button', { name: 'Reload' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('1');
    });
    expect(getBySharedId).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });

  it('keeps the loaded entity when a silent reload fails', async () => {
    renderHookView();
    expect(await screen.findByTestId('file-count')).toHaveTextContent('0');

    getBySharedId.mockRejectedValue(new Error('offline'));
    await act(async () => {
      screen.getByRole('button', { name: 'Reload' }).click();
    });

    expect(screen.getByTestId('file-count')).toHaveTextContent('0');
    expect(screen.queryByText('Missing')).not.toBeInTheDocument();
  });

  it('shows a recorded translation without fetching again', async () => {
    renderHookView();
    expect(await screen.findByTestId('file-count')).toHaveTextContent('0');
    await act(async () => {
      screen.getByRole('button', { name: 'Record' }).click();
    });
    expect(screen.getByTestId('es-title')).toHaveTextContent('(AI translation pending) Hola');
    expect(getBySharedId).toHaveBeenCalledTimes(1);
  });

  it('shows a finished reload instead of the recorded pending text', async () => {
    getBySharedId.mockResolvedValue([
      [{ ...entityWithoutFile, translations: pendingSpanish.translations }],
    ]);
    renderHookView(pendingSpanish);
    expect(await screen.findByTestId('es-title')).toHaveTextContent(
      '(AI translation pending) Hola'
    );
    getBySharedId.mockResolvedValue([
      [{ ...entityWithoutFile, translations: { es: { title: [{ value: 'Hola' }] } } }],
    ]);
    await act(async () => {
      screen.getByRole('button', { name: 'Reload' }).click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('es-title')).toHaveTextContent('Hola');
    });
  });

  it('shows a translation recorded before the preview opens', async () => {
    renderHookView(pendingSpanish);
    expect(await screen.findByTestId('es-title')).toHaveTextContent(
      '(AI translation pending) Hola'
    );
    expect(getBySharedId).toHaveBeenCalledTimes(1);
  });
});
