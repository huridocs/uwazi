/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { localeAtom } from '#V2/atoms/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { useOverlayEntity } from '../useOverlayEntity.js';

const sharedId = 'a1';
type EntityApiResponse = ApiResponse<Entity[] | undefined>;

class Deferred<T> {
  resolve!: (value: T) => void;

  promise = new Promise<T>(resolve => {
    this.resolve = resolve;
  });
}

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
  let getBySharedId: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    entityLoaderCache.invalidateAll();
    getBySharedId = jest.fn(async (_id: string, { language }: { language: string }) => {
      if (language === 'en') {
        return [[entityForLanguage('en', 'Metadata in English')]];
      }
      return [[entityForLanguage('es', 'Metadata en Español')]];
    });
  });

  const renderOverlay = (store: ReturnType<typeof createStore>) =>
    render(
      <Provider store={store}>
        <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
          <OverlayEntityView sharedId={sharedId} />
        </ServicesProvider>
      </Provider>
    );

  it('fetches fresh entity when language changes in overlay', async () => {
    const store = createStore();
    store.set(localeAtom, 'en');

    renderOverlay(store);

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
    expect(getBySharedId).toHaveBeenCalledWith(sharedId, {
      language: 'en',
      omitRelationships: true,
    });
    expect(getBySharedId).toHaveBeenCalledWith(sharedId, {
      language: 'es',
      omitRelationships: true,
    });
  });

  it('ignores stale responses after the language changes', async () => {
    const englishResponse = new Deferred<EntityApiResponse>();
    const spanishResponse = new Deferred<EntityApiResponse>();
    const store = createStore();
    store.set(localeAtom, 'en');

    getBySharedId.mockImplementation(async (_id: string, { language }: { language: string }) => {
      if (language === 'en') {
        return englishResponse.promise;
      }
      return spanishResponse.promise;
    });

    renderOverlay(store);

    act(() => {
      store.set(localeAtom, 'es');
    });

    await act(async () => {
      spanishResponse.resolve([[entityForLanguage('es', 'Metadata en Español')]]);
      await spanishResponse.promise;
    });

    expect(screen.getByText('Metadata en Español')).toBeVisible();

    await act(async () => {
      englishResponse.resolve([[entityForLanguage('en', 'Late English metadata')]]);
      await englishResponse.promise;
    });

    expect(screen.getByText('Metadata en Español')).toBeVisible();
    expect(screen.queryByText('Late English metadata')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });
});
