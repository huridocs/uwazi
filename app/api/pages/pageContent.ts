import { createError } from '#api/utils/index.js';
import { PageType } from '#shared/types/pageType.js';

export type PageContentMode = 'published' | 'draft';

const emptyDraft = (): NonNullable<PageType['draft']> => ({
  content: '',
  script: '',
  css: '',
});

const draftFromPage = (page: PageType): NonNullable<PageType['draft']> => {
  if (page.draft) {
    return {
      content: page.draft.content ?? '',
      script: page.draft.script ?? '',
      css: page.draft.css ?? '',
    };
  }
  if (page.metadata) {
    return {
      content: page.metadata.content ?? '',
      script: page.metadata.script ?? '',
      css: page.metadata.css ?? '',
    };
  }
  return emptyDraft();
};

/** Published: last release, or legacy metadata when `releases` is not yet an array. Draft: always `draft` (or metadata fallback). */
export const resolvePageForClient = (page: PageType, mode: PageContentMode): PageType => {
  const next: PageType = { ...page };
  const draft = draftFromPage(page);

  if (mode === 'draft') {
    next.metadata = {
      ...next.metadata,
      content: draft.content,
      script: draft.script,
      css: draft.css,
    };
    return next;
  }

  const releases = page.releases;
  if (Array.isArray(releases) && releases.length > 0) {
    const last = releases[releases.length - 1];
    next.metadata = {
      ...next.metadata,
      content: last.content,
      script: last.script,
      css: last.css,
    };
    return next;
  }
  if (Array.isArray(releases) && releases.length === 0) {
    throw createError('Page not found', 404);
  }

  next.metadata = {
    ...next.metadata,
    content: draft.content,
    script: draft.script,
    css: draft.css,
  };
  return next;
};

export const legacyVersionToDisableMarkdown = (version: number | undefined): boolean => {
  if (version === undefined || version === null || Number.isNaN(Number(version))) {
    return false;
  }
  return Number(version) >= 2;
};
