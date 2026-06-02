import { PageType } from '#shared/types/pageType.js';

export type PageContentMode = 'published' | 'draft';

const emptyDraft = () => ({
  content: '',
  script: '',
  css: '',
});

const localeDraft = (page: PageType, language?: string) => {
  const lang = language ?? page.language;
  if (lang && page.locales?.[lang]?.draft) {
    const d = page.locales[lang].draft!;
    return {
      content: d.content ?? '',
      script: d.script ?? '',
      css: d.css ?? '',
    };
  }
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

/** Published: last release for language, or draft/metadata fallback. Draft: locale/draft. */
export const resolvePageForClient = (
  page: PageType,
  mode: PageContentMode,
  language?: string
): PageType => {
  const next: PageType = { ...page };
  const lang = language ?? page.language;
  const draft = localeDraft(page, lang);

  if (mode === 'draft') {
    next.metadata = { ...next.metadata, ...draft };
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

  next.metadata = { ...next.metadata, ...draft };
  return next;
};

export const pageParsesMarkdown = (page: { markdownSupport?: boolean }) =>
  page.markdownSupport === true;
