import { EntityWithFiles } from '#api/core/application/contracts/EntitiesDAO.js';
import { FilesRow } from '../files/PostgresFilesRow.js';
import { EntityRow } from './PostgresEntityRow.js';
import { toEntityDBO } from './entityRow.js';

const filesBySharedId = (files: FilesRow[]) =>
  files.reduce((grouped, file) => {
    const key = file.entity ?? '';
    const group = grouped.get(key) ?? [];
    group.push(file);
    grouped.set(key, group);
    return grouped;
  }, new Map<string, FilesRow[]>());

const toEntityWithFiles = (entity: EntityRow, files: FilesRow[]): EntityWithFiles =>
  ({
    ...toEntityDBO(entity),
    documents: files.filter(file => file.type === 'document'),
    attachments: files.filter(file => file.type === 'attachment'),
  }) as unknown as EntityWithFiles;

const entitiesWithFiles = (entities: EntityRow[], files: FilesRow[]): EntityWithFiles[] => {
  const grouped = filesBySharedId(files);
  return entities.map(entity => toEntityWithFiles(entity, grouped.get(entity.sharedId) ?? []));
};

export { entitiesWithFiles };
