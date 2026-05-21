import { createError } from '#api/utils/index.js';
import type { PageDraft, PageLocale, PageRelease, PageType } from '#shared/types/pageType.js';
import type { Page, PageReleaseSnapshot } from '#api/pages/domain/Page.js';
import { PageLocaleNotFoundError } from '#api/pages/domain/errors.js';

const releaseToClient = (snapshot: PageReleaseSnapshot, language: string): PageRelease => {
  const locale = snapshot.locales[language];
  return {
    version: snapshot.version,
    content: locale?.draft.content ?? '',
    script: locale?.draft.script,
    css: locale?.draft.css,
    release_message: snapshot.releaseMessage,
    user: snapshot.userId,
    date: snapshot.date,
  };
};

/** Flat PageType for a single request language (editor / public API). */
export const pageToClient = (
  page: Page,
  language: string,
  releases: PageReleaseSnapshot[] = []
): PageType => {
  const locale = page.getLocale(language);
  const clientReleases = releases.map(r => releaseToClient(r, language));

  return {
    _id: page.id,
    sharedId: page.sharedId,
    title: locale.title,
    slug: locale.slug,
    language,
    creationDate: page.creationDate,
    user: page.userId,
    entityView: page.entityView,
    markdownSupport: page.markdownSupport,
    draft: locale.draft as PageDraft,
    releases: clientReleases,
    metadata: {
      content: locale.draft.content,
      script: locale.draft.script,
      css: locale.draft.css,
    },
  };
};

/** Apply flat editor payload into domain Page for one language. */
export const applyClientToPage = (page: Page, client: PageType, language: string): void => {
  if (client.entityView !== undefined) {
    page.entityView = client.entityView;
  }
  if (client.markdownSupport !== undefined) {
    page.markdownSupport = client.markdownSupport;
  }

  const draft = client.draft ?? {
    content: client.metadata?.content ?? '',
    script: client.metadata?.script ?? '',
    css: client.metadata?.css ?? '',
  };

  const patch = {
    title: client.title,
    slug: client.slug,
    draft: {
      content: draft.content ?? '',
      script: draft.script ?? '',
      css: draft.css ?? '',
    },
  };

  const keys = page.getLocaleKeys();
  if (keys.includes(language)) {
    page.updateLocale(language, patch);
  } else if (keys.length > 0) {
    page.addLocale(language, keys[0]);
    page.updateLocale(language, patch);
  }
};

const localePayloadToPatch = (locale: PageLocale) => {
  const draft = locale.draft ?? { content: '', script: '', css: '' };
  return {
    title: locale.title ?? '',
    slug: locale.slug,
    draft: {
      content: draft.content ?? '',
      script: draft.script ?? '',
      css: draft.css ?? '',
    },
  };
};

/** Full editor payload: all locales, no duplicated root title/slug/draft. */
export const pageToEditorClient = (
  page: Page,
  languageKeys: string[],
  releases: PageReleaseSnapshot[] = []
): PageType => {
  const locales: Record<string, PageLocale> = {};
  const releasesByLocale: Record<string, PageRelease[]> = {};

  languageKeys.forEach(lang => {
    try {
      const locale = page.getLocale(lang);
      locales[lang] = {
        title: locale.title,
        slug: locale.slug,
        draft: { ...locale.draft },
      };
    } catch (error) {
      if (error instanceof PageLocaleNotFoundError) {
        locales[lang] = { title: '', slug: 'page', draft: { content: '', script: '', css: '' } };
      } else {
        throw error;
      }
    }
    releasesByLocale[lang] = releases.map(r => releaseToClient(r, lang));
  });

  return {
    _id: page.id,
    sharedId: page.sharedId,
    creationDate: page.creationDate,
    user: page.userId,
    entityView: page.entityView,
    markdownSupport: page.markdownSupport,
    locales,
    releasesByLocale,
  };
};

/** Merge editor `locales` map into domain page (multi-locale save). */
export const applyEditorClientToPage = (
  page: Page,
  client: PageType,
  installedLanguageKeys: string[]
): void => {
  if (client.entityView !== undefined) {
    page.entityView = client.entityView;
  }
  if (client.markdownSupport !== undefined) {
    page.markdownSupport = client.markdownSupport;
  }

  const clientLocales = client.locales ?? {};
  const keys = Object.keys(clientLocales);
  if (keys.length === 0) {
    return;
  }

  const unknown = keys.filter(k => !installedLanguageKeys.includes(k));
  if (unknown.length > 0) {
    throw createError(`Unknown language keys: ${unknown.join(', ')}`, 400);
  }

  const fallbackLang =
    installedLanguageKeys.find(k => page.getLocaleKeys().includes(k)) ??
    installedLanguageKeys[0];

  keys.forEach(lang => {
    const patch = localePayloadToPatch(clientLocales[lang]!);
    if (!page.getLocaleKeys().includes(lang)) {
      page.addLocale(lang, fallbackLang);
    }
    page.updateLocale(lang, patch);
  });
};

export const hasEditorLocalesPayload = (client: PageType): boolean =>
  !!client.locales && Object.keys(client.locales).length > 0;
