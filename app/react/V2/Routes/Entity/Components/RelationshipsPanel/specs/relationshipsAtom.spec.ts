/**
 * @jest-environment jsdom
 */
import { createStore } from 'jotai';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { RelationshipView } from '#V2/formatters/relationships/types.js';
import { relationshipsActions, relationshipsStateAtom } from '../relationshipsAtom.js';

const selection: TextSelection = {
  text: 'Selected text',
  selectionRectangles: [{ top: 0, left: 0, width: 10, height: 10, regionId: '1' }],
};

const relationship: RelationshipView = {
  _id: 'rel-1',
  type: 'rel-type',
  from: {
    type: 'entity',
    entity: 'entity1',
    entityTitle: 'Source',
    entityTemplateId: 'template1',
  },
  to: {
    type: 'entity',
    entity: 'target1',
    entityTitle: 'Target',
    entityTemplateId: 'template2',
  },
};

describe('relationshipsAtom', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('stores relationships', () => {
    store.set(relationshipsActions.setRelationships, [relationship]);

    expect(store.get(relationshipsStateAtom).relationships).toEqual([relationship]);
  });

  it('opens the create-reference flow', () => {
    store.set(relationshipsActions.setCreateReferenceSelection, selection, 'text');

    expect(store.get(relationshipsStateAtom)).toMatchObject({
      createReferenceSelection: selection,
      createReferenceMode: 'text',
    });
  });

  it('removes a relationship from state', () => {
    store.set(relationshipsActions.setRelationships, [relationship]);
    store.set(relationshipsActions.deleteRelationship, 'rel-1');

    expect(store.get(relationshipsStateAtom).relationships).toEqual([]);
  });
});
