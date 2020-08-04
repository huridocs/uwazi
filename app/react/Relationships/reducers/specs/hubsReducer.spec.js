import Immutable from 'immutable';
import * as types from '../../actions/actionTypes';
import hubsReducer from '../hubsReducer';

describe('Hubs Reducer', () => {
  let state;
  const entity1 = { title: 'Entity one', metadata: {}, sharedId: 'entityone' };
  const entity2 = { title: 'Entity two', metadata: {}, sharedId: 'entitytwo' };
  const entity3 = { title: 'Entity three', metadata: {}, sharedId: 'entitythree' };

  beforeEach(() => {
    state = Immutable.fromJS([
      {
        hub: '123',
        leftRelationship: {
          entity: 'entityone',
          entityData: entity1,
        },
        rightRelationships: [
          {
            hub: '123',
            template: 'A',
            relationships: [
              { hub: '123', entityData: entity2, entity: 'entitytwo' },
              { hub: '123', entityData: entity3, entity: 'entitythree' },
            ],
          },
        ],
      },
      {
        hub: '456',
        leftRelationship: {
          entity: 'entityone',
          entityData: entity1,
        },
        rightRelationships: [
          {
            hub: '456',
            template: 'A',
            relationships: [{ hub: '456', entityData: entity2, entity: 'entitytwo' }],
          },
        ],
      },
    ]);
  });

  describe('removeEntity', () => {
    it('should remove the entity fron all the positions', () => {
      const updatedData = { sharedId: 'entitytwo', title: 'Updated', metadata: {} };
      const action = { type: types.UPDATE_RELATIONSHIP_ENTITY_DATA, entity: updatedData };
      const updatedState = hubsReducer(state, action);
      expect(updatedState.toJS()[0].rightRelationships[0].relationships[0].entityData.title).toBe(
        'Updated'
      );

      expect(updatedState.toJS()[1].rightRelationships[0].relationships[0].entityData.title).toBe(
        'Updated'
      );
    });
  });
});
