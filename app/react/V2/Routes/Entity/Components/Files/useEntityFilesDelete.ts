import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { remove } from '#V2/api/files/index.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { isFileRowSelectable } from './fileHelpers.js';
import { EntityFileRow } from './types.js';

type UseEntityFilesDeleteArgs = {
  allRows: EntityFileRow[];
  selectedRowIds: string[];
  setSelectedRowIds: Dispatch<SetStateAction<string[]>>;
  setFocusedRowId: Dispatch<SetStateAction<string | undefined>>;
  refreshEntity: () => Promise<void>;
};

type DeleteEntityFileRowsArgs = {
  pendingDeleteRows: EntityFileRow[];
  setPendingDeleteRows: Dispatch<SetStateAction<EntityFileRow[]>>;
  setSelectedRowIds: Dispatch<SetStateAction<string[]>>;
  setFocusedRowId: Dispatch<SetStateAction<string | undefined>>;
  refreshEntity: () => Promise<void>;
};

async function deleteEntityFileRows({
  pendingDeleteRows,
  setPendingDeleteRows,
  setSelectedRowIds,
  setFocusedRowId,
  refreshEntity,
}: DeleteEntityFileRowsArgs) {
  const ids = pendingDeleteRows.map(row => row.raw._id).filter((id): id is string => Boolean(id));
  const deletedRowIds = new Set(pendingDeleteRows.map(row => row.rowId));
  setPendingDeleteRows([]);
  if (!ids.length) return;
  await Promise.all(ids.map(async id => remove(id)));
  setSelectedRowIds(prev => prev.filter(id => !deletedRowIds.has(id)));
  setFocusedRowId(prev => (prev && deletedRowIds.has(prev) ? undefined : prev));
  ids.forEach(id => entityLoaderCache.invalidatePlaintext(id));
  await refreshEntity();
}

const useEntityFilesDelete = ({
  allRows,
  selectedRowIds,
  setSelectedRowIds,
  setFocusedRowId,
  refreshEntity,
}: UseEntityFilesDeleteArgs) => {
  const [pendingDeleteRows, setPendingDeleteRows] = useState<EntityFileRow[]>([]);

  const requestDeleteRow = useCallback((row: EntityFileRow) => {
    if (!isFileRowSelectable(row)) return;
    setPendingDeleteRows([row]);
  }, []);

  const requestDeleteSelected = useCallback(() => {
    const rows = allRows.filter(
      row => selectedRowIds.includes(row.rowId) && isFileRowSelectable(row)
    );
    if (!rows.length) return;
    setPendingDeleteRows(rows);
  }, [allRows, selectedRowIds]);

  const closeDeleteModal = useCallback(() => setPendingDeleteRows([]), []);

  const deleteRows = useCallback(async () => {
    await deleteEntityFileRows({
      pendingDeleteRows,
      setPendingDeleteRows,
      setSelectedRowIds,
      setFocusedRowId,
      refreshEntity,
    });
  }, [pendingDeleteRows, refreshEntity, setFocusedRowId, setSelectedRowIds]);

  return {
    pendingDeleteRows,
    requestDeleteRow,
    requestDeleteSelected,
    closeDeleteModal,
    deleteRows,
  };
};

export { useEntityFilesDelete };
