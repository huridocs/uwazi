import { t } from '#app/I18N/index.js';
import type { Page, PageLocaleForm } from '#V2/shared/types.js';
import type { PageDraft } from '#shared/types/pageType.js';

const NEW_PAGE_TITLE_KEY = 'New page';

/** Default title per collection language (uses System translations for that locale). */
export const newPageDefaultTitle = (): string => {
  return t('System', NEW_PAGE_TITLE_KEY, null, false);
};

export type PageEditorLanguage = {
  key: string;
  label?: string;
  default?: boolean;
};

const emptyDraft = (): PageDraft => ({ content: '', script: '', css: '' });

const emptyLocale = (title = ''): PageLocaleForm => ({
  title,
  draft: emptyDraft(),
});

export const defaultActiveLocale = (languages: PageEditorLanguage[]): string => {
  const def = languages.find(l => l.default);
  return def?.key ?? languages[0]?.key ?? 'en';
};

export const buildInitialLocales = (
  languages: PageEditorLanguage[],
  page: Page,
  isNewPage: boolean
): Record<string, PageLocaleForm> => {
  const locales: Record<string, PageLocaleForm> = {};

  languages.forEach(lang => {
    const fromServer = page.locales?.[lang.key];
    if (fromServer) {
      const draft = fromServer.draft ?? emptyDraft();
      locales[lang.key] = {
        title: fromServer.title ?? '',
        draft: {
          content: draft.content ?? '',
          script: draft.script ?? '',
          css: draft.css ?? '',
        },
      };
      return;
    }

    const title = isNewPage ? newPageDefaultTitle() : '';
    locales[lang.key] = emptyLocale(title);
  });

  return locales;
};

export const buildPageEditorFormValues = (page: Page, languages: PageEditorLanguage[]): Page => {
  const isNewPage = !page.sharedId;
  return {
    ...page,
    sharedId: page.sharedId,
    entityView: page.entityView ?? false,
    markdownSupport: page.markdownSupport !== false,
    locales: buildInitialLocales(languages, page, isNewPage),
  };
};

export const buildEditorSavePayload = (data: Page): Page => {
  const payload: Page = {
    _id: data._id,
    sharedId: data.sharedId,
    entityView: data.entityView,
    markdownSupport: data.markdownSupport,
    locales: {},
  };

  if (data.locales) {
    Object.entries(data.locales).forEach(([lang, locale]) => {
      const draft = locale.draft ?? emptyDraft();
      payload.locales![lang] = {
        title: locale.title ?? '',
        draft: {
          content: draft.content ?? '',
          script: draft.script ?? '',
          css: draft.css ?? '',
        },
      };
    });
  }

  if (!payload.sharedId && payload.markdownSupport !== false) {
    delete payload.markdownSupport;
  }

  return payload;
};
