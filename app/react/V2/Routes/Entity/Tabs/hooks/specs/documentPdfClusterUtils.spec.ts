/**
 * @jest-environment jsdom
 */
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  clusterMarkersToHighlights,
  getMarkerRefIds,
  toggleClusterIfActive,
} from '../documentPdfClusterUtils.js';

const marker = (
  id: string,
  selections: { page: number; top: number; left: number; width: number; height: number }[]
): RelationshipMarker => ({
  _id: id,
  target: { sharedId: 't', title: 'T', templateId: 'tmpl' },
  relationship: {
    _id: id,
    hub: `hub-${id}`,
    type: 'rel',
    relationshipTypeName: 'Related',
    relationTypeOnSelf: false,
    from: {
      type: 'textReference',
      entity: 'e',
      entityTitle: 'E',
      entityTemplateId: 'tmpl',
      file: 'f1',
      text: 'quote',
      selections,
    },
    to: {
      type: 'entity',
      entity: 't',
      entityTitle: 'T',
      entityTemplateId: 'tmpl',
    },
  },
  anchor: {
    type: 'textReference',
    entity: 'e',
    entityTitle: 'E',
    entityTemplateId: 'tmpl',
    file: 'f1',
    text: 'quote',
    selections,
  },
});

describe('documentPdfClusterUtils', () => {
  it('builds multi-rect highlights for every cluster marker', () => {
    const highlights = clusterMarkersToHighlights(
      [
        marker('a', [
          { page: 1, top: 1, left: 1, width: 2, height: 2 },
          { page: 1, top: 3, left: 3, width: 2, height: 2 },
        ]),
        marker('b', [{ page: 1, top: 5, left: 5, width: 2, height: 2 }]),
      ],
      () => '#00ff00'
    );

    expect(highlights).toHaveLength(2);
    expect(highlights[0]?.[1]?.[0]?.textSelection.selectionRectangles).toHaveLength(2);
    expect(highlights[1]?.[1]?.[0]?.textSelection.selectionRectangles).toHaveLength(1);
    expect(getMarkerRefIds([marker('a', []), marker('b', [])])).toEqual(['a', 'b']);
  });

  it('clears when the same cluster is toggled off', () => {
    const onClear = jest.fn();
    expect(toggleClusterIfActive(['a', 'b'], ['a', 'b'], onClear)).toBe(true);
    expect(onClear).toHaveBeenCalled();
    expect(toggleClusterIfActive(['a'], ['a', 'b'], onClear)).toBe(false);
  });
});
