import {
  Page,
  PageContent,
  PageLocaleData,
  PageReleaseSnapshot,
} from '#api/pages.v2/domain/Page.js';

export type PageRow = {
  _id: string;
  shared_id: string;
  creation_date?: number | null;
  entity_view: boolean;
  markdown_support: boolean;
};

export type PageLocaleRow = {
  page_id: string;
  language: string;
  title: string;
  draft_content: string;
  draft_script: string;
  draft_css: string;
};

export type PageReleaseRow = {
  _id: string;
  page_id: string;
  version: number;
  release_message: string;
  user_id?: string | null;
  date: number;
  locales: Record<string, PageLocaleData>;
};

const toContent = (row: PageLocaleRow): PageContent => ({
  content: row.draft_content ?? '',
  script: row.draft_script ?? '',
  css: row.draft_css ?? '',
});

export class PostgresPageMapper {
  static toDomain(row: PageRow, localeRows: PageLocaleRow[]): Page {
    const locales: Record<string, PageLocaleData> = {};
    localeRows.forEach(localeRow => {
      locales[localeRow.language] = {
        title: localeRow.title ?? '',
        draft: toContent(localeRow),
      };
    });

    return new Page({
      id: row._id,
      sharedId: row.shared_id,
      creationDate: row.creation_date ?? Date.now(),
      entityView: row.entity_view ?? false,
      markdownSupport: row.markdown_support ?? false,
      locales,
    });
  }

  static toRow(page: Page): PageRow {
    return {
      _id: page.id,
      shared_id: page.sharedId,
      creation_date: page.creationDate,
      entity_view: page.entityView,
      markdown_support: page.markdownSupport,
    };
  }

  static toLocaleRows(page: Page): PageLocaleRow[] {
    return Object.entries(page.getLocales()).map(([language, locale]) => ({
      page_id: page.id,
      language,
      title: locale.title,
      draft_content: locale.draft.content,
      draft_script: locale.draft.script,
      draft_css: locale.draft.css,
    }));
  }

  static releaseSnapshotToRow(
    pageId: string,
    id: string,
    snapshot: PageReleaseSnapshot
  ): PageReleaseRow {
    return {
      _id: id,
      page_id: pageId,
      version: snapshot.version,
      release_message: snapshot.releaseMessage,
      user_id: snapshot.userId,
      date: snapshot.date,
      locales: Object.fromEntries(
        Object.entries(snapshot.locales).map(([language, locale]) => [
          language,
          { title: locale.title, draft: { ...locale.draft } },
        ])
      ),
    };
  }

  static rowToReleaseSnapshot(row: PageReleaseRow): PageReleaseSnapshot {
    return {
      version: row.version,
      releaseMessage: row.release_message ?? '',
      userId: row.user_id ?? '',
      date: row.date,
      locales: Object.fromEntries(
        Object.entries(row.locales ?? {}).map(([language, locale]) => [
          language,
          { title: locale.title ?? '', draft: { ...locale.draft } },
        ])
      ),
    };
  }
}
