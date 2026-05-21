import { Page } from '#api/pages/domain/Page.js';
import { PagesDataSource } from '#api/pages/application/contracts/PagesDataSource.js';

const allocateUniqueSlug = async (
  baseSlug: string,
  excludeSharedId: string,
  pagesDS: PagesDataSource
): Promise<string> => {
  const base = baseSlug || 'page';
  let candidate = base;
  let suffix = 2;

  while (await pagesDS.existsWithSlug(candidate, excludeSharedId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

/**
 * Ensures each locale slug is non-empty and unique across pages.
 * The same slug may repeat on different locales of one page.
 */
export const ensurePageSlugsAreUnique = async (
  page: Page,
  pagesDS: PagesDataSource
): Promise<void> => {
  for (const lang of page.getLocaleKeys()) {
    const current = page.getLocale(lang);
    const slug = await allocateUniqueSlug(current.slug, page.sharedId, pagesDS);
    if (slug !== current.slug) {
      page.updateLocale(lang, { slug });
    }
  }
};
