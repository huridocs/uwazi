import type { Entity } from '#V2/api/entities/types.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';

type CreatedLibraryRows = {
  hits: readonly LibrarySearchHit[];
  totalBefore: number | null;
};

type CreatedLibraryInput = {
  row: LibrarySearchHit;
  totalRows: number;
  rows: readonly LibrarySearchHit[];
};

const libraryHitFromEntity = (entity: Entity): LibrarySearchHit => ({
  _id: entity._id || entity.sharedId,
  sharedId: entity.sharedId,
  title: entity.title || '',
  template: entity.template || '',
  language: entity.language || '',
  ...(entity.creationDate !== undefined ? { creationDate: entity.creationDate } : {}),
  ...(entity.metadata ? { metadata: entity.metadata } : {}),
  ...(entity.documents ? { documents: entity.documents } : {}),
});

const settleCreatedRows = (
  created: CreatedLibraryRows,
  rows: readonly LibrarySearchHit[]
): CreatedLibraryRows => {
  if (created.totalBefore === null || created.hits.length === 0) {
    return { hits: [], totalBefore: null };
  }
  const hits = created.hits.filter(hit => !rows.some(row => row.sharedId === hit.sharedId));
  if (hits.length === created.hits.length) return created;
  if (hits.length === 0) return { hits: [], totalBefore: null };
  return { hits, totalBefore: created.totalBefore + (created.hits.length - hits.length) };
};

const forgetCreatedRows = (
  created: CreatedLibraryRows,
  sharedIds: readonly string[]
): CreatedLibraryRows => {
  if (created.hits.length === 0 || sharedIds.length === 0) return created;
  const hits = created.hits.filter(hit => !sharedIds.includes(hit.sharedId));
  if (hits.length === created.hits.length) return created;
  if (hits.length === 0) return { hits: [], totalBefore: null };
  return { hits, totalBefore: created.totalBefore };
};

const rememberCreatedRow = (
  created: CreatedLibraryRows,
  input: CreatedLibraryInput
): CreatedLibraryRows => {
  const settled = settleCreatedRows(created, input.rows);
  if (settled.hits.some(hit => hit.sharedId === input.row.sharedId)) return settled;
  return {
    hits: [input.row, ...settled.hits],
    totalBefore: settled.totalBefore ?? input.totalRows,
  };
};

const mergeCreatedLibraryRows = (
  rows: readonly LibrarySearchHit[],
  totalRows: number,
  created: CreatedLibraryRows
): { rows: LibrarySearchHit[]; totalRows: number } => {
  const settled = settleCreatedRows(created, rows);
  if (settled.totalBefore === null) return { rows: [...rows], totalRows };
  const serverGrowth = Math.max(0, totalRows - settled.totalBefore);
  const extra = Math.max(0, settled.hits.length - serverGrowth);
  return { rows: [...settled.hits, ...rows], totalRows: totalRows + extra };
};

export { forgetCreatedRows, libraryHitFromEntity, mergeCreatedLibraryRows, rememberCreatedRow };
export type { CreatedLibraryRows };
