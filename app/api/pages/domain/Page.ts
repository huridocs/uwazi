import kebabCase from 'lodash/kebabCase.js';
import {
  CannotRemoveLastLocaleError,
  InvalidPageReleaseError,
  PageLocaleNotFoundError,
} from './errors.js';

export type PageContent = {
  content: string;
  script: string;
  css: string;
};

export type PageLocaleData = {
  title: string;
  slug: string;
  draft: PageContent;
};

export type PageReleaseSnapshot = {
  version: number;
  releaseMessage: string;
  userId: string;
  date: number;
  locales: Record<string, PageLocaleData>;
};

export type PageProps = {
  id: string;
  sharedId: string;
  creationDate: number;
  userId: string;
  entityView: boolean;
  markdownSupport: boolean;
  locales: Record<string, PageLocaleData>;
};

const emptyContent = (): PageContent => ({
  content: '',
  script: '',
  css: '',
});

export const slugFromTitle = (title: string) => kebabCase(title.trim()) || 'page';

/** Non-empty slug; normalizes user input or falls back to title. */
export const normalizeSlug = (raw: string | undefined, fallbackTitle: string): string => {
  const trimmed = (raw ?? '').trim();
  const fromInput = trimmed ? slugFromTitle(trimmed) : '';
  const fromTitle = slugFromTitle(fallbackTitle);
  return fromInput || fromTitle || 'page';
};

const cloneLocale = (locale: PageLocaleData): PageLocaleData => ({
  title: locale.title,
  slug: locale.slug,
  draft: { ...locale.draft },
});

export class Page {
  readonly id: string;

  readonly sharedId: string;

  readonly creationDate: number;

  readonly userId: string;

  entityView: boolean;

  markdownSupport: boolean;

  private locales: Record<string, PageLocaleData>;

  constructor(props: PageProps) {
    this.id = props.id;
    this.sharedId = props.sharedId;
    this.creationDate = props.creationDate;
    this.userId = props.userId;
    this.entityView = props.entityView ?? false;
    this.markdownSupport = props.markdownSupport ?? false;
    this.locales = { ...props.locales };
  }

  getLocales(): Record<string, PageLocaleData> {
    return Object.fromEntries(
      Object.entries(this.locales).map(([lang, data]) => [lang, cloneLocale(data)])
    );
  }

  getLocaleKeys(): string[] {
    return Object.keys(this.locales);
  }

  getLocale(language: string): PageLocaleData {
    const locale = this.locales[language];
    if (!locale) {
      throw new PageLocaleNotFoundError(language);
    }
    return cloneLocale(locale);
  }

  updateLocale(language: string, patch: Partial<PageLocaleData>): void {
    const current = this.getLocale(language);
    const title = patch.title ?? current.title;
    const slug =
      patch.slug !== undefined
        ? normalizeSlug(patch.slug, title)
        : patch.title !== undefined
          ? slugFromTitle(title)
          : normalizeSlug(current.slug, title);
    this.locales[language] = {
      title,
      slug,
      draft: patch.draft ? { ...current.draft, ...patch.draft } : current.draft,
    };
  }

  addLocale(language: string, sourceLanguage: string): void {
    if (this.locales[language]) {
      return;
    }
    const source = this.getLocale(sourceLanguage);
    this.locales[language] = cloneLocale(source);
  }

  removeLocale(language: string): void {
    if (!this.locales[language]) {
      return;
    }
    if (Object.keys(this.locales).length <= 1) {
      throw new CannotRemoveLastLocaleError();
    }
    const { [language]: _removed, ...rest } = this.locales;
    this.locales = rest;
  }

  buildRelease(params: {
    releaseMessage: string;
    actorId: string;
    date: number;
    languageKeys: string[];
    nextVersion: number;
  }): PageReleaseSnapshot {
    const message = params.releaseMessage.trim();
    if (!message) {
      throw new InvalidPageReleaseError('Release message is required');
    }
    if (!this.sharedId) {
      throw new InvalidPageReleaseError('Page must have a sharedId to publish');
    }

    const snapshotLocales: Record<string, PageLocaleData> = {};
    let hasPublishableContent = false;

    params.languageKeys.forEach(lang => {
      const locale = this.locales[lang];
      if (!locale) {
        snapshotLocales[lang] = {
          title: '',
          slug: slugFromTitle(''),
          draft: emptyContent(),
        };
        return;
      }
      snapshotLocales[lang] = cloneLocale(locale);
      if (locale.draft.content.trim()) {
        hasPublishableContent = true;
      }
    });

    if (!hasPublishableContent) {
      throw new InvalidPageReleaseError('At least one locale must have non-empty content to publish');
    }

    return {
      version: params.nextVersion,
      releaseMessage: message,
      userId: params.actorId,
      date: params.date,
      locales: snapshotLocales,
    };
  }

  applyReleaseToDraft(release: PageReleaseSnapshot, installedLanguageKeys: string[]): void {
    const allowed = new Set(installedLanguageKeys);
    Object.entries(release.locales).forEach(([lang, snapshot]) => {
      if (!allowed.has(lang)) {
        return;
      }
      if (!this.locales[lang]) {
        this.locales[lang] = cloneLocale(snapshot);
        return;
      }
      this.locales[lang] = {
        title: snapshot.title,
        slug: snapshot.slug,
        draft: { ...snapshot.draft },
      };
    });
  }

  static createEmptyLocale(title: string): PageLocaleData {
    return {
      title,
      slug: slugFromTitle(title),
      draft: emptyContent(),
    };
  }

  static createForNewPage(params: {
    id: string;
    sharedId: string;
    userId: string;
    creationDate: number;
    languageKeys: string[];
    title: string;
    entityView?: boolean;
    markdownSupport?: boolean;
  }): Page {
    const locales = params.languageKeys.reduce<Record<string, PageLocaleData>>((acc, lang) => {
      acc[lang] = Page.createEmptyLocale(params.title);
      return acc;
    }, {});

    return new Page({
      id: params.id,
      sharedId: params.sharedId,
      creationDate: params.creationDate,
      userId: params.userId,
      entityView: params.entityView ?? false,
      markdownSupport: params.markdownSupport ?? true,
      locales,
    });
  }
}
