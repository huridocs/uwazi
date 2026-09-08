/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { localeAtom } from '#V2/atoms/index.js';
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

const PreviewProbe = () => {
  const { entity, loading, error, reload } = useLibraryPreviewEntity(sharedId);
  if (loading) return <div>Loading</div>;
  if (error || !entity) return <div>Missing</div>;
  return (
    <div>
      <span data-testid="file-count">{entity.documents?.length ?? 0}</span>
      <button
        type="button"
        onClick={() => {
          reload().catch(() => undefined);
        }}
      >
        Reload
      </button>
    </div>
  );
};

describe('useLibraryPreviewEntity', () => {
  let getBySharedId: jest.Mock;

  beforeEach(() => {
    getBySharedId = jest.fn().mockResolvedValue([[entityWithoutFile]]);
  });

  const renderHookView = () =>
    render(
      <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
        <TestAtomStoreProvider initialValues={[[localeAtom, 'en']]}>
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
});
