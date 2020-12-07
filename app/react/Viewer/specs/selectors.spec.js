import { fromJS as Immutable } from 'immutable';
import * as selectors from '../selectors';

describe('Viewer selectors', () => {
  let state;

  beforeEach(() => {
    state = {
      documentViewer: {
        doc: Immutable({ sharedId: 'docSharedId' }),
        targetDoc: Immutable({ sharedId: 'targetDocSharedId' }),
        references: Immutable([
          {
            _id: 'r1',
            entity: 'docSharedId',
            reference: { selectionRectangles: [], text: 'reference' },
            hub: 'hub1',
          },
          {
            _id: 'r2',
            entity: 'docSharedId',
            hub: 'hub2',
          },
          { _id: 'r3', entity: 'id1', hub: 'hub2' },
          { _id: 'r4', entity: 'id2', hub: 'hub1' },
          { _id: 'r5', entity: 'id3', hub: 'hub1' },
          {
            _id: 'r6',
            entity: 'id4',
            reference: { selectionRectangles: [], text: 'should be excluded' },
            hub: 'hub3',
          },
          {
            _id: 'r7',
            entity: 'docSharedId',
            reference: { selectionRectangles: [], text: 'batman' },
            hub: 'hub4',
          },
          {
            _id: 'r8',
            entity: 'id5',
            reference: { selectionRectangles: [], text: 'should be associated' },
            hub: 'hub4',
          },
        ]),
        targetDocReferences: Immutable([
          {
            _id: 'r9',
            entity: 'docSharedId',
            reference: { selectionRectangles: [], text: 'robin' },
            hub: 'hub3',
          },
          { _id: 'r10', entity: 'id6', hub: 'hub3' },
          {
            _id: 'r11',
            entity: 'targetDocSharedId',
            reference: { selectionRectangles: [], text: 'alfred' },
            hub: 'hub4',
          },
          { _id: 'r12', entity: 'id8', hub: 'hub4' },
        ]),
      },
    };
  });

  describe('selectDoc', () => {
    it('should select the documentViewer doc', () => {
      expect(selectors.selectDoc(state)).toBe(state.documentViewer.doc);
      expect(selectors.selectDoc(state).get('sharedId')).toBe('docSharedId');
    });
  });

  describe('selectReferences', () => {
    it('should select doc text references and split them according to the hub they belong to', () => {
      const expectedReferences = [
        {
          _id: 'r1',
          entity: 'docSharedId',
          reference: { selectionRectangles: [], text: 'reference' },
          hub: 'hub1',
          associatedRelationship: {
            _id: 'r4',
            entity: 'id2',
            hub: 'hub1',
          },
        },
        {
          _id: 'r1',
          entity: 'docSharedId',
          reference: { selectionRectangles: [], text: 'reference' },
          hub: 'hub1',
          associatedRelationship: {
            _id: 'r5',
            entity: 'id3',
            hub: 'hub1',
          },
        },
        {
          _id: 'r7',
          entity: 'docSharedId',
          reference: { selectionRectangles: [], text: 'batman' },
          hub: 'hub4',
          associatedRelationship: {
            _id: 'r8',
            entity: 'id5',
            reference: { selectionRectangles: [], text: 'should be associated' },
            hub: 'hub4',
          },
        },
      ];

      expect(selectors.selectReferences(state).toJS()).toEqual(expectedReferences);
    });
  });

  describe('selectTargetDoc', () => {
    it('should select the documentViewer doc', () => {
      expect(selectors.selectTargetDoc(state)).toBe(state.documentViewer.targetDoc);
      expect(selectors.selectTargetDoc(state).get('sharedId')).toBe('targetDocSharedId');
    });
  });

  describe('selectTargetReferences', () => {
    it('should select targetDoc text references and split them according to the hub they belong to', () => {
      const expectedReferences = [
        {
          _id: 'r11',
          entity: 'targetDocSharedId',
          reference: { selectionRectangles: [], text: 'alfred' },
          hub: 'hub4',
          associatedRelationship: {
            _id: 'r12',
            entity: 'id8',
            hub: 'hub4',
          },
        },
      ];

      expect(selectors.selectTargetReferences(state).toJS()).toEqual(expectedReferences);
    });
  });
});
