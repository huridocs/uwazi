import type { RelationshipTableColumn, RelationshipTableRow } from './ConnectionCardStack.js';

type MergedInheritCell = {
  columnIndex: number;
  rowSpan: number;
  lead: boolean;
};

type MergedConnectionRow = {
  row: RelationshipTableRow;
  cells: MergedInheritCell[];
};

const MISSING = '\uFFFF';

const connectionSortKey = (column: RelationshipTableColumn, entityId: string): string => {
  const keyed = column.sortKeyByEntityId?.[entityId];
  if (typeof keyed === 'string') return keyed;
  const cell = column.cellsByEntityId?.[entityId];
  if (typeof cell === 'string' || typeof cell === 'number') return String(cell);
  return '';
};

const distinctRollup = (
  rows: RelationshipTableRow[],
  column: RelationshipTableColumn
): { text: string; title: string } | undefined => {
  const present = rows
    .map(row => connectionSortKey(column, row.id))
    .filter(value => value.length > 0);
  if (!present.length) return undefined;
  const n = new Set(present).size;
  return { text: `${n} distinct`, title: `${n} distinct values across ${present.length}` };
};

type SortKey = (row: RelationshipTableRow, index: number) => string;

const advanceSpan = ({
  merged,
  index,
  columnIndex,
  leadIdx,
  norm,
}: {
  merged: MergedConnectionRow[];
  index: number;
  columnIndex: number;
  leadIdx: number;
  norm: SortKey;
}): number => {
  const current = merged[index];
  const previous = merged[index - 1];
  const currentCell = current?.cells[columnIndex];
  const leadCell = merged[leadIdx]?.cells[columnIndex];
  if (!current || !previous || !currentCell || !leadCell) return index;
  const sameLeft = Array.from({ length: columnIndex + 1 }, (_, left) => left).every(
    left => norm(current.row, left) === norm(previous.row, left)
  );
  if (!sameLeft) return index;
  currentCell.lead = false;
  leadCell.rowSpan += 1;
  return leadIdx;
};

const spanMatchingCells = (merged: MergedConnectionRow[], norm: SortKey) => {
  const colCount = merged[0]?.cells.length ?? 0;
  for (let columnIndex = 0; columnIndex < colCount; columnIndex += 1) {
    let leadIdx = 0;
    for (let index = 1; index < merged.length; index += 1) {
      leadIdx = advanceSpan({ merged, index, columnIndex, leadIdx, norm });
    }
  }
};

const mergeConnectionRows = (
  rows: RelationshipTableRow[],
  columns: RelationshipTableColumn[]
): MergedConnectionRow[] => {
  const colCount = columns.length;
  const norm: SortKey = (row, index) => {
    const column = columns[index];
    return column ? connectionSortKey(column, row.id) || MISSING : MISSING;
  };
  const sorted = [...rows].sort((left, right) => {
    for (let index = 0; index < colCount; index += 1) {
      const compared = norm(left, index).localeCompare(norm(right, index));
      if (compared) return compared;
    }
    return left.label.localeCompare(right.label);
  });
  const merged: MergedConnectionRow[] = sorted.map(row => ({
    row,
    cells: columns.map((_, columnIndex) => ({ columnIndex, rowSpan: 1, lead: true })),
  }));
  spanMatchingCells(merged, norm);
  return merged;
};

export { mergeConnectionRows, connectionSortKey, distinctRollup };
export type { MergedConnectionRow, MergedInheritCell };
