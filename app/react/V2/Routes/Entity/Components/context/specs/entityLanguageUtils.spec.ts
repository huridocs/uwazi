/**
 * @jest-environment jsdom
 */
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { entityLoaderCache } from '../../../EntityLoaderCache.js';
import { resolveMainDocument, resolveSyncMode } from '../entityLanguageUtils.js';

describe('resolveSyncMode', () => {
  it('seeds only and marks pending adopt when dirty/saving', () => {
    expect(
      resolveSyncMode({
        loaderLanguageChanged: true,
        pendingAdopt: false,
        preserveUiLanguage: true,
        loaderLanguage: 'es',
        uiLanguage: 'en',
      })
    ).toEqual({ mode: 'seed-only', pendingAdopt: true });

    expect(
      resolveSyncMode({
        loaderLanguageChanged: false,
        pendingAdopt: false,
        preserveUiLanguage: true,
        loaderLanguage: 'en',
        uiLanguage: 'es',
      })
    ).toEqual({ mode: 'seed-only', pendingAdopt: false });
  });

  it('adopts loader when language changed and UI can be replaced', () => {
    expect(
      resolveSyncMode({
        loaderLanguageChanged: true,
        pendingAdopt: false,
        preserveUiLanguage: false,
        loaderLanguage: 'es',
        uiLanguage: 'en',
      })
    ).toEqual({ mode: 'adopt-loader', pendingAdopt: false });
  });

  it('adopts loader when a deferred adopt becomes safe', () => {
    expect(
      resolveSyncMode({
        loaderLanguageChanged: false,
        pendingAdopt: true,
        preserveUiLanguage: false,
        loaderLanguage: 'es',
        uiLanguage: 'en',
      })
    ).toEqual({ mode: 'adopt-loader', pendingAdopt: false });
  });

  it('matches loader docs when languages already align', () => {
    expect(
      resolveSyncMode({
        loaderLanguageChanged: false,
        pendingAdopt: false,
        preserveUiLanguage: false,
        loaderLanguage: 'en',
        uiLanguage: 'en',
      })
    ).toEqual({ mode: 'match-loader-docs', pendingAdopt: false });
  });
});

describe('resolveMainDocument', () => {
  const sharedId = 'shared1';
  const staleDoc = { _id: 'stale', filename: 'stale.pdf', language: 'eng' } as FileType;
  const freshDoc = { _id: 'fresh', filename: 'fresh.pdf', language: 'eng' } as FileType;

  beforeEach(() => {
    entityLoaderCache.invalidateAll();
    entityLoaderCache.setMainDocument(sharedId, 'en', staleDoc);
  });

  it('prefers documents from the entity over a stale cache entry', () => {
    const documents = [freshDoc] as Entity['documents'];
    expect(resolveMainDocument(sharedId, 'en', documents)).toEqual(freshDoc);
    expect(entityLoaderCache.getMainDocument(sharedId, 'en')).toEqual(freshDoc);
  });

  it('falls back to cache when entity has no documents', () => {
    expect(resolveMainDocument(sharedId, 'en', [])).toEqual(staleDoc);
  });
});
