import { ObjectId } from 'mongodb';
import { MigrationConfig, RowsMigrationConfig } from '../MigrateCollectionToPostgres.js';

type PageLocaleDoc = {
  title?: unknown;
  draft?: { content?: unknown; script?: unknown; css?: unknown };
};

const idOf = (value: unknown): string =>
  value instanceof ObjectId ? value.toHexString() : String(value);

const stringOf = (value: unknown): string => (typeof value === 'string' ? value : '');

export const PageMigrationConfig: MigrationConfig = {
  mongoCollection: 'pages',
  pgTable: 'pages',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: idOf(doc._id),
      shared_id: doc.sharedId,
      creation_date: doc.creationDate ?? null,
      entity_view: doc.entityView ?? false,
      markdown_support: doc.markdownSupport ?? false,
    };
  },
};

/**
 * Locales live nested inside the mongo pages document, so one document fans out
 * into one page_locales row per language.
 */
export const PageLocalesMigrationConfig: RowsMigrationConfig = {
  mongoCollection: 'pages',
  pgTable: 'page_locales',
  mapRows(doc: Record<string, unknown>) {
    const locales = (doc.locales ?? {}) as Record<string, PageLocaleDoc>;
    return Object.entries(locales).map(([language, locale]) => ({
      page_id: idOf(doc._id),
      language,
      title: stringOf(locale?.title),
      draft_content: stringOf(locale?.draft?.content),
      draft_script: stringOf(locale?.draft?.script),
      draft_css: stringOf(locale?.draft?.css),
    }));
  },
};
