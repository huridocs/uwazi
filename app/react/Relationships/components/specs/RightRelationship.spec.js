import React from 'react';
import Immutable from 'immutable';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { Doc } from '#app/Library/components/Doc.js';
import DropdownList from 'react-widgets/lib/DropdownList.js';
import * as types from '../../actions/actionTypes.js';

import { RightRelationship } from '../RightRelationship.js';
import { HubRelationshipMetadata } from '../HubRelationshipMetadata.js';

const mockStore = configureStore([thunk]);

describe('RelationshipsGraphEdit', () => {
  let component;
  let store;
  let props;
  let hub;

  beforeEach(() => {
    hub = {
      hub: '1',
      leftRelationship: { entity: 'sharedId1', hub: 1, template: '123' },
      rightRelationships: [
        {
          template: null,
          relationships: [
            { entity: 'sharedId2', hub: 1, template: null, entityData: { sharedId: 'sharedId2' } },
            { entity: 'sharedId4', hub: 1, template: null, entityData: { sharedId: 'sharedId4' } },
          ],
        },
        {
          template: '456',
          relationships: [
            { entity: 'sharedId2', hub: 1, template: '456', entityData: { sharedId: 'sharedId2' } },
            { entity: 'sharedId3', hub: 1, template: '456', entityData: { sharedId: 'sharedId3' } },
          ],
        },
      ],
    };

    props = {
      index: 0,
      hubActions: Immutable.fromJS({ editing: false }),
      search: { sort: 'creationDate', order: 'desc', treatAs: 'number' },
      relationTypes: [{ _id: '123', name: 'Friend' }],
      parentEntity: Immutable.fromJS({}),
      hub: Immutable.fromJS(hub),
      editing: false,
      searchResults: Immutable.fromJS({ rows: [] }),
      updateRightRelationshipType: jasmine.createSpy('updateRightRelationshipType'),
      toggleRemoveRightRelationshipGroup: jasmine.createSpy('toggleRemoveRightRelationshipGroup'),
      toggleMoveEntity: jasmine.createSpy('toggleMoveEntity'),
      setAddToData: jasmine.createSpy('setAddToData'),
      toggleRemoveEntity: jasmine.createSpy('toggleRemoveEntity'),
      moveEntities: jasmine.createSpy('moveEntities'),
      openAddEntitiesPanel: jasmine.createSpy('openAddEntitiesPanel'),
      selectConnection: jasmine.createSpy('selectConnection'),
    };
  });

  const getStoreData = () => ({
    locale: 'en',
    relationships: {
      list: { sort: props.search },
      hubs: Immutable.List([props.hub]),
      hubActions: props.hubActions,
    },
    relationTypes: Immutable.fromJS(props.relationTypes),
    translations: Immutable.fromJS([
      { locale: 'en', contexts: props.relationTypes.map(r => ({ id: r._id })) },
    ]),
  });

  const render = () => {
    store = mockStore(getStoreData());
    component = shallow(
      <Provider store={store}>
        <RightRelationship {...props} />
      </Provider>
    )
      .dive({ context: { store } })
      .dive();
  };

  describe('render()', () => {
    beforeEach(render);

    it('should render the relationship groups', () => {
      expect(component.find('.rightRelationshipsTypeGroup').length).toBe(2);
      expect(component.find(Doc).length).toBe(4);
      expect(component.find(Doc).at(0).props().doc).toEqual(
        Immutable.fromJS(hub.rightRelationships[0].relationships[0].entityData)
      );
      expect(component.find(HubRelationshipMetadata).length).toBe(4);
      expect(component.find(HubRelationshipMetadata).at(0).props().relationship).toEqual(
        Immutable.fromJS(hub.rightRelationships[0].relationships[0])
      );
    });
  });

  describe('clicking in a relationship', () => {
    it('should select that connection', () => {
      render();
      component.find(Doc).at(0).simulate('click');
      expect(store.getActions()).toContainEqual(
        jasmine.objectContaining({ type: 'relationships/connection/SET' })
      );
    });
  });

  describe('when relationships have text references with ranges', () => {
    it('should render the Docs with the target text reference', () => {
      hub.rightRelationships[0].relationships[0].reference = {
        text: 'Hu ha!',
        selectionRectangles: [],
      };
      hub.rightRelationships[1].relationships[1].reference = {
        text: ':D',
        selectionRectangles: [],
      };
      props.hub = Immutable.fromJS(hub);
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('while editing', () => {
    beforeEach(() => {
      props.hubActions = Immutable.fromJS({ editing: true });
      render();
    });

    describe('clicking on the delete button next to a relationship', () => {
      it('should mark that relationship to be deleted', () => {
        component.find('.removeEntity button').at(0).simulate('click');
        expect(store.getActions()).toContainEqual({
          type: types.TOGGLE_REMOVE_RELATIONSHIPS_ENTITY,
          index: 0,
          rightIndex: 0,
          relationshipIndex: 0,
        });
      });
    });

    describe('clicking on the delete button next to a right group', () => {
      it('should mark that entire gtoup to be deleted', () => {
        component.find('.removeRightRelationshipGroup button').at(0).simulate('click');
        expect(store.getActions()).toContainEqual({
          type: types.TOGGLE_REMOVE_RELATIONSHIPS_RIGHT_GROUP,
          index: 0,
          rightIndex: 0,
        });
      });
    });

    describe('clicking on the add new relationship', () => {
      it('should call setAddToData and openAddEntitiesPanel', () => {
        component.find('.relationships-new').at(0).simulate('click');
        expect(store.getActions()).toContainEqual({
          type: types.SET_RELATIONSHIPS_ADD_TO_DATA,
          index: 0,
          rightIndex: 0,
        });
        expect(store.getActions()).toContainEqual({ type: types.OPEN_RELATIONSHIPS_PANEL });
      });
    });

    describe('changing the template of a group', () => {
      it('should call updateRightRelationshipType', () => {
        component.find(DropdownList).at(0).simulate('change', { _id: 3 });
        expect(store.getActions()).toContainEqual(
          jasmine.objectContaining({
            type: types.UPDATE_RELATIONSHIPS_RIGHT_TYPE,
            index: 0,
            rightIndex: 0,
            _id: 3,
          })
        );
      });
    });
  });
});
