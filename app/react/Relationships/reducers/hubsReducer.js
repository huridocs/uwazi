import * as types from '../actions/actionTypes';
import {fromJS} from 'immutable';

const initialState = [];

const emptyRigthRelationship = () => {
  return {relationships: []};
};

export default function (state = initialState, action = {}) {
  let relationships;
  let value;

  switch (action.type) {

  case types.PARSE_RELATIONSHIPS_RESULTS:
    const hubsObject = action.results.get('rows')
    .reduce((hubs, row) => {
      let hubsImmutable = hubs;
      row.get('connections').forEach(connection => {
        const hubId = connection.get('hub');
        if (!hubsImmutable.has(hubId)) {
          hubsImmutable = hubsImmutable.set(hubId, fromJS({hub: hubId, leftRelationship: {}, rightRelationships: {}}));
        }

        if (row.get('sharedId') === action.parentEntity.get('sharedId')) {
          hubsImmutable = hubsImmutable.setIn([hubId, 'leftRelationship'], connection);
        } else {
          const templateId = connection.get('template');
          if (!hubsImmutable.getIn([hubId, 'rightRelationships']).has(templateId)) {
            hubsImmutable = hubsImmutable.setIn([hubId, 'rightRelationships', templateId], fromJS([]));
          }
          const newConnection = connection.set('entity', row.delete('connections'));
          hubsImmutable = hubsImmutable.setIn([hubId, 'rightRelationships', templateId],
                                              hubsImmutable.getIn([hubId, 'rightRelationships', templateId]).push(newConnection));
        }
      });

      return hubsImmutable;
    }, fromJS({}));

    const hubsArray = hubsObject.reduce((hubs, hub) => {
      let index = 0;
      const rightRelationships = hub.get('rightRelationships').reduce((memo, relationshipsArray, template) => {
        let newMemo = memo.push(fromJS({}).set('template', template).set('relationships', relationshipsArray));
        index += 1;
        if (index === hub.get('rightRelationships').size) {
          newMemo = newMemo.push(fromJS(emptyRigthRelationship()));
        }
        return newMemo;
      }, fromJS([]));
      return hubs.push(hub.set('rightRelationships', rightRelationships));
    }, fromJS([]));

    return hubsArray;

  case types.ADD_RELATIONSHIPS_HUB:
    return state.push(fromJS({
      leftRelationship: {template: null},
      rightRelationships: [emptyRigthRelationship()]
    }));

  case types.UPDATE_RELATIONSHIPS_LEFT_TYPE:
    return state
    .setIn([action.index, 'leftRelationship', 'template'], action._id)
    .setIn([action.index, 'modified'], true);

  case types.TOGGLE_REMOVE_RELATIONSHIPS_LEFT:
    value = state.getIn([action.index, 'deleted']);
    return state.setIn([action.index, 'deleted'], !value);

  case types.UPDATE_RELATIONSHIPS_RIGHT_TYPE:
    let updatedHubs = state
    .setIn([action.index, 'rightRelationships', action.rightIndex, 'template'], action._id)
    .setIn([action.index, 'rightRelationships', action.rightIndex, 'modified'], true);

    relationships = state
    .getIn([action.index, 'rightRelationships', action.rightIndex, 'relationships'])
    .map(relationship => relationship.set('template', action._id));

    updatedHubs = updatedHubs.setIn([action.index, 'rightRelationships', action.rightIndex, 'relationships'], relationships);

    if (action.rightIndex === state.getIn([action.index, 'rightRelationships']).size - 1) {
      const updatedRightRelationships = updatedHubs.getIn([action.index, 'rightRelationships']).push(fromJS(emptyRigthRelationship()));
      updatedHubs = updatedHubs.setIn([action.index, 'rightRelationships'], updatedRightRelationships);
    }

    return updatedHubs;

  case types.TOGGLE_REMOVE_RELATIONSHIPS_RIGHT_GROUP:
    value = state.getIn([action.index, 'rightRelationships', action.rightIndex, 'deleted']);
    return state.setIn([action.index, 'rightRelationships', action.rightIndex, 'deleted'], !value);

  case types.ADD_RELATIONSHIPS_ENTITY:
    const relationship = state.getIn([action.index, 'rightRelationships', action.rightIndex]);
    relationships = relationship.get('relationships').push(fromJS({template: relationship.get('template'), entity: action.entity}));

    return state.setIn([action.index, 'rightRelationships', action.rightIndex, 'relationships'], relationships);

  case types.TOGGLE_REMOVE_RELATIONSHIPS_ENTITY:
    value = state.getIn([action.index, 'rightRelationships', action.rightIndex, 'relationships', action.relationshipIndex, 'deleted']);
    return state.setIn([action.index, 'rightRelationships', action.rightIndex, 'relationships', action.relationshipIndex, 'deleted'], !value);

  default:
    return fromJS(state);
  }
}
