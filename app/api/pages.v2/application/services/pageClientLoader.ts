import { PageType } from '#shared/types/pageType.js';
import { PageLocaleNotFoundError, PageNotFoundError } from '#api/pages.v2/domain/errors.js';
import { PagesDataSource } from '../contracts/PagesDataSource.js';
import { PageReleasesDataSource } from '../contracts/PageReleasesDataSource.js';
import {
  pageToClient,
  pageToEditorClient,
} from '#api/pages.v2/application/services/pageProjection.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';

export type PageLookup = { sharedId?: string };

export const normalizePageLookup = (lookup: string | PageLookup): PageLookup =>
  typeof lookup === 'string' ? { sharedId: lookup } : lookup;

export const findPageForLookup = async (lookup: PageLookup, pagesDS: PagesDataSource) => {
  const { sharedId } = lookup;

  if (!sharedId) {
    return null;
  }

  return pagesDS.getBySharedId(sharedId);
};

export const loadClientPage = async (
  lookup: string | PageLookup,
  language: string,
  pagesDS: PagesDataSource,
  releasesDS: PageReleasesDataSource
): Promise<PageType> => {
  const resolved = normalizePageLookup(lookup);
  const result = await findPageForLookup(resolved, pagesDS);

  if (!result || result.isError()) {
    throw new PageNotFoundError(resolved.sharedId ?? '');
  }

  const page = result.getDataOrThrow();
  const releases = await releasesDS.listByPageId(page.id);
  try {
    return pageToClient(page, language, releases);
  } catch (error) {
    if (error instanceof PageLocaleNotFoundError) {
      throw new PageNotFoundError(resolved.sharedId ?? '');
    }
    throw error;
  }
};

export const loadClientPageForEditor = async (
  lookup: string | PageLookup,
  pagesDS: PagesDataSource,
  pageReleasesDS: PageReleasesDataSource,
  settingsDS: SettingsDataSource
): Promise<PageType> => {
  const resolved = normalizePageLookup(lookup);
  const result = await findPageForLookup(resolved, pagesDS);

  if (!result || result.isError()) {
    throw new PageNotFoundError(resolved.sharedId ?? '');
  }

  const page = result.getDataOrThrow();
  const languageKeys = await settingsDS.getLanguageKeys();
  const releases = await pageReleasesDS.listByPageId(page.id);
  return pageToEditorClient(page, languageKeys, releases);
};
