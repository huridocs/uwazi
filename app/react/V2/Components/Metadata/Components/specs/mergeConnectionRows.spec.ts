import { mergeConnectionRows } from '../mergeConnectionRows.js';
import type { RelationshipTableColumn, RelationshipTableRow } from '../ConnectionCardStack.js';

const rows: RelationshipTableRow[] = [
  { id: 'ana', label: 'Ana' },
  { id: 'ben', label: 'Ben' },
  { id: 'cam', label: 'Cam' },
  { id: 'drew', label: 'Drew' },
];

const columns: RelationshipTableColumn[] = [
  {
    label: 'Country',
    cellsByEntityId: { ana: 'Kenya', ben: 'Kenya', cam: 'Uganda' },
  },
  {
    label: 'Role',
    cellsByEntityId: { ana: 'Judge', ben: 'Clerk', cam: 'Judge', drew: 'Judge' },
  },
];

describe('mergeConnectionRows', () => {
  it('sorts by inherit columns then entity title, with missing values last', () => {
    const merged = mergeConnectionRows(rows, columns);
    expect(merged.map(row => row.row.id)).toEqual(['ben', 'ana', 'cam', 'drew']);
  });

  it('merges hierarchically so a cell spans only when it and every column to its left match', () => {
    const merged = mergeConnectionRows(rows, columns);
    expect(merged[0].cells[0]).toEqual({ columnIndex: 0, rowSpan: 2, lead: true });
    expect(merged[1].cells[0]).toEqual({ columnIndex: 0, rowSpan: 1, lead: false });
    expect(merged[0].cells[1]).toEqual({ columnIndex: 1, rowSpan: 1, lead: true });
    expect(merged[1].cells[1]).toEqual({ columnIndex: 1, rowSpan: 1, lead: true });
    expect(merged[2].cells[0].lead).toBe(true);
    expect(merged[2].cells[0].rowSpan).toBe(1);
    expect(merged[3].cells[0].lead).toBe(true);
  });
});
