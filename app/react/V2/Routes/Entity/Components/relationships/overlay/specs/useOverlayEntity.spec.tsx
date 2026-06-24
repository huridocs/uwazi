/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { localeAtom } from '#V2/atoms/index.js';
import * as entityApi from '#V2/api/entities/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { useOverlayEntity } from '../useOverlayEntity.js';

jest.mock('#V2/api/entities/index.js');

const sharedId = 'a1';

const entityForLanguage = (language: string, title: string): Entity => ({
  _id: `${sharedId}-${language}`,
  sharedId,
  language,
  title,
  template: 'template1',
  creationDate: 1,
  user: 'user1',
  documents: [],
  attachments: [],
});

const OverlayEntityView = ({ sharedId: entitySharedId }: { sharedId: string }) => {
  const { entity, loading } = useOverlayEntity(entitySharedId);
  if (loading) {
    return <div>Loading</div>;
  }
  return <div>{entity?.title}</div>;
};

describe('useOverlayEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    entityLoaderCache.invalidateAll();
    jest.spyOn(entityApi, 'getBySharedId').mockImplementation(async ({ language }) => {
      if (language === 'en') {
        return [[entityForLanguage('en', 'Metadata in English')]];
      }
      return [[entityForLanguage('es', 'Metadata en Español')]];
    });
  });

  it('fetches fresh entity when language changes in overlay', async () => {
    const store = createStore();
    store.set(localeAtom, 'en');

    render(
      <Provider store={store}>
        <OverlayEntityView sharedId={sharedId} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Metadata in English')).toBeVisible();
    });

    act(() => {
      store.set(localeAtom, 'es');
    });

    expect(screen.queryByText('Metadata in English')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Metadata en Español')).toBeVisible();
    });
    expect(entityApi.getBySharedId).toHaveBeenCalledWith({
      sharedId,
      language: 'en',
      omitRelationships: true,
    });
    expect(entityApi.getBySharedId).toHaveBeenCalledWith({
      sharedId,
      language: 'es',
      omitRelationships: true,
    });
  });
});
