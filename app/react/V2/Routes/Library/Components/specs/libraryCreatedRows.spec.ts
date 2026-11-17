import type { Template } from '#app/apiResponseTypes.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { libraryMapMarkers } from '../Viewers/libraryMapMarkers.js';
import {
  forgetCreatedRows,
  mergeCreatedLibraryRows,
  rememberCreatedRow,
} from '../libraryCreatedRows.js';

const created: LibrarySearchHit = {
  _id: 'new',
  sharedId: 'created-1',
  title: 'Paella',
  template: 'notes',
  language: 'en',
  metadata: { note: [{ value: 'lunch' }] },
};

const second: LibrarySearchHit = {
  _id: 'new-2',
  sharedId: 'created-2',
  title: 'Second',
  template: 'notes',
  language: 'en',
};

const loaded: LibrarySearchHit = {
  _id: 'a',
  sharedId: 'alpha',
  title: 'Alpha',
  template: 'notes',
  language: 'en',
};

const templates: Template[] = [
  {
    _id: 'notes',
    name: 'Notes',
    properties: [{ _id: 'note', name: 'note', label: 'Note', type: 'text' }],
  },
];

describe('mergeCreatedLibraryRows', () => {
  it('prepends a saved entity and counts it until the loader returns that shared id', () => {
    const saved = { hits: [created], totalBefore: 1 };
    expect(mergeCreatedLibraryRows([loaded], 1, saved)).toEqual({
      rows: [created, loaded],
      totalRows: 2,
    });
    expect(mergeCreatedLibraryRows([created, loaded], 2, saved)).toEqual({
      rows: [created, loaded],
      totalRows: 2,
    });
  });

  it('keeps every created row the loader has not returned', () => {
    const saved = rememberCreatedRow(
      rememberCreatedRow(
        { hits: [], totalBefore: null },
        { row: created, totalRows: 1, rows: [loaded] }
      ),
      { row: second, totalRows: 1, rows: [loaded] }
    );
    expect(mergeCreatedLibraryRows([loaded], 1, saved).rows.map(row => row.sharedId)).toEqual([
      'created-2',
      'created-1',
      'alpha',
    ]);
  });

  it('does not add a created row the loader total already includes', () => {
    const saved = { hits: [created], totalBefore: 1 };
    expect(mergeCreatedLibraryRows([loaded], 2, saved).totalRows).toBe(2);
    expect(mergeCreatedLibraryRows([loaded], 1, saved).totalRows).toBe(2);
  });

  it('counts a later created row after an earlier one is already in the loader', () => {
    const saved = { hits: [second, created], totalBefore: 1 };
    const listed = [created, loaded];
    expect(mergeCreatedLibraryRows(listed, 2, saved).totalRows).toBe(3);
    expect(mergeCreatedLibraryRows(listed, 3, saved).totalRows).toBe(3);
    expect(mergeCreatedLibraryRows(listed, 2, saved).rows[0]?.sharedId).toBe('created-2');
  });

  it('drops a created row deleted before the loader returns it', () => {
    const saved = rememberCreatedRow(
      { hits: [], totalBefore: null },
      { row: created, totalRows: 1, rows: [loaded] }
    );
    const remaining = forgetCreatedRows(saved, [created.sharedId]);
    expect(mergeCreatedLibraryRows([loaded], 1, remaining)).toEqual({
      rows: [loaded],
      totalRows: 1,
    });
  });

  it('skips a created row that has no coordinates on the map', () => {
    const { rows } = mergeCreatedLibraryRows([loaded], 1, { hits: [created], totalBefore: 1 });
    expect(
      libraryMapMarkers(rows, templates).find(
        marker => marker.properties?.entity?.sharedId === created.sharedId
      )
    ).toBeUndefined();
  });
});
