import { fromJS } from 'immutable';
import * as types from '../actions/actionTypes';

const initialState = [];

const emptyRigthRelationship = () => ({ relationships: [] });

const conformRelationships = action => {
  let order = -1;
  const hubsObject = (action.results.get('rows') || fromJS([])).reduce((hubs, row) => {
    let hubsImmutable = hubs;
    row.get('connections').forEach(connection => {
      const hubId = connection.get('hub').toString();
      if (!hubsImmutable.has(hubId)) {
        order += 1;
        hubsImmutable = hubsImmutable.set(
          hubId,
          fromJS({ hub: hubId, order, leftRelationship: {}, rightRelationships: {} })
        );
      }

      if (row.get('sharedId') === action.parentEntity.get('sharedId')) {
        hubsImmutable = hubsImmutable.setIn([hubId, 'leftRelationship'], connection);
      } else {
        const templateId = connection.get('template');
        if (!hubsImmutable.getIn([hubId, 'rightRelationships']).has(templateId)) {
          hubsImmutable = hubsImmutable.setIn(
            [hubId, 'rightRelationships', templateId],
            fromJS([])
          );
        }
        hubsImmutable = hubsImmutable.setIn(
          [hubId, 'rightRelationships', templateId],
          hubsImmutable.getIn([hubId, 'rightRelationships', templateId]).push(connection)
        );
      }
    });

    return hubsImmutable;
  }, fromJS({}));

  return hubsObject.reduce((hubs, hub) => {
    let index = 0;
    const rightRelationships = hub
      .get('rightRelationships')
      .reduce((memo, relationshipsArray, template) => {
        let newMemo = memo.push(
          fromJS({}).set('template', template).set('relationships', relationshipsArray)
        );
        index += 1;
        if (action.editing && index === hub.get('rightRelationships').size) {
          newMemo = newMemo.push(fromJS(emptyRigthRelationship()));
        }
        return newMemo;
      }, fromJS([]));
    return hubs.set(hub.get('order'), hub.set('rightRelationships', rightRelationships));
  }, fromJS([]));
};

export default function (state = initialState, action = {}) {
  let relationships;
  let value;
  let updatedHubs;
  let relationship;
  let target;
  let relationshipsToMove;
  let relationshipsMoved;
  let _state;
  let targetTemplate;
  const toUpdate = [];

  switch (action.type) {
    case types.PARSE_RELATIONSHIPS_RESULTS:
      return conformRelationships(action);

    case types.EDIT_RELATIONSHIPS:
      return conformRelationships(action);

    case types.ADD_RELATIONSHIPS_HUB:
      return state.push(
        fromJS({
          leftRelationship: { template: null },
          rightRelationships: [emptyRigthRelationship()],
        })
      );

    case types.UPDATE_RELATIONSHIPS_LEFT_TYPE:
      return state
        .setIn([action.index, 'leftRelationship', 'template'], action._id)
        .setIn([action.index, 'modified'], true);

    case types.TOGGLE_REMOVE_RELATIONSHIPS_LEFT:
      value = state.getIn([action.index, 'deleted']);
      return state.setIn([action.index, 'deleted'], !value);

    case types.UPDATE_RELATIONSHIPS_RIGHT_TYPE:
      updatedHubs = state
        .setIn([action.index, 'rightRelationships', action.rightIndex, 'template'], action._id)
        .setIn([action.index, 'rightRelationships', action.rightIndex, 'modified'], true);

      relationships = state
        .getIn([action.index, 'rightRelationships', action.rightIndex, 'relationships'])
        .map(relations => relations.set('template', action._id));

      updatedHubs = updatedHubs.setIn(
        [action.index, 'rightRelationships', action.rightIndex, 'relationships'],
        relationships
      );

      if (action.newRightRelationshipType) {
        const updatedRightRelationships = updatedHubs
          .getIn([action.index, 'rightRelationships'])
          .push(fromJS(emptyRigthRelationship()));
        updatedHubs = updatedHubs.setIn(
          [action.index, 'rightRelationships'],
          updatedRightRelationships
        );
      }

      return updatedHubs;

    case types.TOGGLE_REMOVE_RELATIONSHIPS_RIGHT_GROUP:
      value = state.getIn([action.index, 'rightRelationships', action.rightIndex, 'deleted']);
      return state.setIn(
        [action.index, 'rightRelationships', action.rightIndex, 'deleted'],
        !value
      );

    case types.ADD_RELATIONSHIPS_ENTITY:
      relationship = state.getIn([action.index, 'rightRelationships', action.rightIndex]);
      relationships = relationship.get('relationships').push(
        fromJS({
          template: relationship.get('template'),
          entity: action.entity.sharedId,
          entityData: action.entity,
        })
      );

      return state.setIn(
        [action.index, 'rightRelationships', action.rightIndex, 'relationships'],
        relationships
      );

    case types.TOGGLE_REMOVE_RELATIONSHIPS_ENTITY:
      value = state.getIn([
        action.index,
        'rightRelationships',
        action.rightIndex,
        'relationships',
        action.relationshipIndex,
        'deleted',
      ]);
      return state.setIn(
        [
          action.index,
          'rightRelationships',
          action.rightIndex,
          'relationships',
          action.relationshipIndex,
          'deleted',
        ],
        !value
      );

    case types.TOGGLE_MOVE_RELATIONSHIPS_ENTITY:
      value = state.getIn([
        action.index,
        'rightRelationships',
        action.rightIndex,
        'relationships',
        action.relationshipIndex,
        'move',
      ]);
      return state.setIn(
        [
          action.index,
          'rightRelationships',
          action.rightIndex,
          'relationships',
          action.relationshipIndex,
          'move',
        ],
        !value
      );

    case types.MOVE_RELATIONSHIPS_ENTITY:
      relationshipsToMove = [];
      relationshipsMoved = [];
      targetTemplate = state.getIn([
        action.index,
        'rightRelationships',
        action.rightRelationshipIndex,
        'template',
      ]);
      state.forEach((hub, hubIndex) => {
        hub.get('rightRelationships').forEach((rightRelationshipGroup, rightRelationshipsIndex) => {
          rightRelationshipGroup.get('relationships').forEach((_relationship, index) => {
            if (_relationship.get('move')) {
              relationshipsToMove.push(
                _relationship
                  .remove('move')
                  .remove('_id')
                  .remove('sharedId')
                  .set('template', targetTemplate)
              );
              relationshipsMoved.push({ hubIndex, rightRelationshipsIndex, index });
            }
          });
        });
      });
      _state = relationshipsMoved
        .reverse()
        .reduce(
          (result, relationShipMoved) =>
            result.setIn(
              [
                relationShipMoved.hubIndex,
                'rightRelationships',
                relationShipMoved.rightRelationshipsIndex,
                'relationships',
                relationShipMoved.index,
                'moved',
              ],
              true
            ),
          state
        );
      target = _state.getIn([
        action.index,
        'rightRelationships',
        action.rightRelationshipIndex,
        'relationships',
      ]);
      return _state.setIn(
        [action.index, 'rightRelationships', action.rightRelationshipIndex, 'relationships'],
        target.concat(relationshipsToMove)
      );

    case types.UPDATE_RELATIONSHIP_ENTITY_DATA:
      state.forEach((_hub, hubIndex) => {
        if (state.getIn([hubIndex, 'leftRelationship', 'entity']) === action.entity.sharedId) {
          toUpdate.push([hubIndex, 'leftRelationship', 'entityData']);
        }

        state.getIn([hubIndex, 'rightRelationships']).forEach((group, groupIndex) => {
          group.get('relationships').forEach((r, relationshipIndex) => {
            if (r.get('entity') === action.entity.sharedId) {
              toUpdate.push([
                hubIndex,
                'rightRelationships',
                groupIndex,
                'relationships',
                relationshipIndex,
                'entityData',
              ]);
            }
          });
        });
      });

      return toUpdate.reduce(
        (updatedState, path) => updatedState.setIn(path, fromJS(action.entity)),
        state
      );

    default:
      return fromJS(state);
  }
}
