import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

const FIXED_KEYS = ['_id', 'page', 'version', 'release_message', 'user', 'date'];

type ReleaseLocaleDoc = {
  title?: unknown;
  content?: unknown;
  script?: unknown;
  css?: unknown;
};

const idOf = (value: unknown): string =>
  value instanceof ObjectId ? value.toHexString() : String(value);

const stringOf = (value: unknown): string => (typeof value === 'string' ? value : '');

const isLocale = (value: unknown): value is ReleaseLocaleDoc =>
  typeof value === 'object' && value !== null && 'content' in value;

/** Languages are stored as dynamic top level keys in mongo, one per language. */
const localesOf = (doc: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(doc)
      .filter(([key, value]) => !FIXED_KEYS.includes(key) && isLocale(value))
      .map(([language, value]) => {
        const locale = value as ReleaseLocaleDoc;
        return [
          language,
          {
            title: stringOf(locale.title),
            draft: {
              content: stringOf(locale.content),
              script: stringOf(locale.script),
              css: stringOf(locale.css),
            },
          },
        ];
      })
  );

export const PageReleaseMigrationConfig: MigrationConfig = {
  mongoCollection: 'page_releases',
  pgTable: 'page_releases',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: idOf(doc._id),
      page_id: idOf(doc.page),
      version: doc.version,
      release_message: stringOf(doc.release_message),
      user_id: doc.user ? idOf(doc.user) : null,
      date: doc.date,
      locales: JSON.stringify(localesOf(doc)),
    };
  },
};
