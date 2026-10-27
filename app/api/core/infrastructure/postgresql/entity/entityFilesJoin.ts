import { EntityWithFiles } from '#api/core/application/contracts/EntitiesDAO.js';
import { FilesRow } from '../files/PostgresFilesRow.js';
import { FILES_COLUMNS_WITHOUT_FULL_TEXT } from '../files/PostgresFilesDAOColumns.js';
import { EntityRow } from './PostgresEntityRow.js';
import { toEntityDBO } from './entityRow.js';

const FILES_ALIAS = '_files';

type EntityRowWithFiles = EntityRow & { [FILES_ALIAS]: Record<string, unknown>[] };

/**
 * A projection that embeds each entity's files as a JSON array, so the entities and their files
 * come back in one statement. Files still go through their own row level security policy.
 */
const filesSubquery = (fullText: boolean): { sql: string; bindings: string[] } => {
  const columns = fullText
    ? [...FILES_COLUMNS_WITHOUT_FULL_TEXT, 'fullText']
    : FILES_COLUMNS_WITHOUT_FULL_TEXT;

  return {
    sql: `(SELECT coalesce(json_agg(f), '[]'::json) FROM (
            SELECT ${columns.map(() => '??').join(', ')} FROM files
            WHERE files.tenant_id = entities.tenant_id AND files.entity = entities."sharedId"
          ) f) AS ??`,
    bindings: [...columns, FILES_ALIAS],
  };
};

/** Empty columns are left out, as they are for every row read through a table. */
const withoutNulls = (file: Record<string, unknown>): FilesRow =>
  Object.fromEntries(Object.entries(file).filter(([, value]) => value !== null)) as FilesRow;

const toEntityWithFiles = (row: EntityRowWithFiles): EntityWithFiles => {
  const { [FILES_ALIAS]: embedded, ...entity } = row;
  const files = embedded.map(withoutNulls);
  return {
    ...toEntityDBO(entity),
    documents: files.filter(file => file.type === 'document'),
    attachments: files.filter(file => file.type === 'attachment'),
  } as unknown as EntityWithFiles;
};

export { filesSubquery, toEntityWithFiles };
export type { EntityRowWithFiles };
