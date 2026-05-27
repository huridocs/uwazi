import { ObjectId } from 'mongodb';
import { Page, PageContent, PageLocaleData, PageReleaseSnapshot } from '#api/pages/domain/Page.js';
import {
  PageDBO,
  PageContentDBO,
  PageLocaleDBO,
  PageReleaseDBO,
  PageReleaseLocaleDBO,
} from './PageDBO.js';

const toContent = (dbo?: PageContentDBO): PageContent => ({
  content: dbo?.content ?? '',
  script: dbo?.script ?? '',
  css: dbo?.css ?? '',
});

const toLocale = (dbo: PageLocaleDBO | undefined, fallbackTitle: string): PageLocaleData => ({
  title: dbo?.title ?? fallbackTitle,
  draft: toContent(dbo?.draft),
});

const contentToDBO = (content: PageContent): PageContentDBO => ({
  content: content.content,
  script: content.script,
  css: content.css,
});

export class PageMapper {
  static toDomain(dbo: PageDBO): Page {
    const locales: Record<string, PageLocaleData> = {};
    Object.entries(dbo.locales ?? {}).forEach(([lang, localeDbo]) => {
      locales[lang] = toLocale(localeDbo, '');
    });

    return new Page({
      id: dbo._id.toHexString(),
      sharedId: dbo.sharedId,
      creationDate: dbo.creationDate ?? Date.now(),
      entityView: dbo.entityView ?? false,
      markdownSupport: dbo.markdownSupport ?? false,
      locales,
    });
  }

  static toDBO(page: Page): PageDBO {
    const locales: Record<string, PageLocaleDBO> = {};
    Object.entries(page.getLocales()).forEach(([lang, locale]) => {
      locales[lang] = {
        title: locale.title,
        draft: contentToDBO(locale.draft),
      };
    });

    return {
      _id: ObjectId.createFromHexString(page.id),
      sharedId: page.sharedId,
      creationDate: page.creationDate,
      entityView: page.entityView,
      markdownSupport: page.markdownSupport,
      locales,
    };
  }

  static releaseSnapshotToDBO(
    pageId: string,
    snapshot: PageReleaseSnapshot
  ): PageReleaseDBO {
    const dbo: PageReleaseDBO = {
      page: ObjectId.createFromHexString(pageId),
      version: snapshot.version,
      release_message: snapshot.releaseMessage,
      user: ObjectId.createFromHexString(snapshot.userId),
      date: snapshot.date,
    };

    Object.entries(snapshot.locales).forEach(([lang, locale]) => {
      dbo[lang] = {
        title: locale.title,
        content: locale.draft.content,
        script: locale.draft.script,
        css: locale.draft.css,
      };
    });

    return dbo;
  }

  static releaseToSnapshot(dbo: PageReleaseDBO, languageKeys: string[]): PageReleaseSnapshot {
    const locales: Record<string, PageLocaleData> = {};
    languageKeys.forEach(lang => {
      const raw = dbo[lang] as PageReleaseLocaleDBO | undefined;
      if (!raw || typeof raw !== 'object' || !('content' in raw)) {
        return;
      }
      locales[lang] = {
        title: raw.title ?? '',
        draft: {
          content: raw.content ?? '',
          script: raw.script ?? '',
          css: raw.css ?? '',
        },
      };
    });

    return {
      version: dbo.version,
      releaseMessage: dbo.release_message ?? '',
      userId: dbo.user?.toHexString() ?? '',
      date: dbo.date,
      locales,
    };
  }

  /** Map legacy per-language page document into locale data. */
  static legacyDocToLocale(dbo: {
    title?: string;
    metadata?: PageContentDBO;
    draft?: PageContentDBO;
  }): PageLocaleData {
    const title = dbo.title ?? '';
    const draft = dbo.draft ? toContent(dbo.draft) : toContent(dbo.metadata);
    return {
      title,
      draft,
    };
  }
}
