import React from 'react';
import EntityView from '../EntityView';
import {shallow} from 'enzyme';
import {actions as formActions} from 'react-redux-form';
import EntitiesAPI from '../EntitiesAPI';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import * as relationships from 'app/Relationships/utils/routeUtils';

describe('EntityView', () => {
  describe('requestState', () => {
    let entities = [{_id: 1, sharedId: 'sid'}];
    let relationTypes = [{_id: 1, name: 'against'}];

    beforeEach(() => {
      spyOn(EntitiesAPI, 'get').and.returnValue(Promise.resolve(entities));
      spyOn(RelationTypesAPI, 'get').and.returnValue(Promise.resolve(relationTypes));
      spyOn(prioritySortingCriteria, 'get').and.returnValue({sort: 'priorized'});
      spyOn(relationships, 'requestState').and.returnValue(Promise.resolve(['connectionsGroups', 'searchResults', 'sort', 'filters']));
      spyOn(relationships, 'emptyState').and.returnValue({type: 'RELATIONSHIPS_EMPTY_STATE'});
      spyOn(relationships, 'setReduxState').and.returnValue({type: 'RELATIONSHIPS_SET_REDUX_STATE'});
    });

    it('should get the entity, and all connectionsList items', (done) => {
      EntityView.requestState({entityId: '123', lang: 'es'}, null, {templates: 'templates'})
      .then((state) => {
        expect(relationships.requestState).toHaveBeenCalledWith('123', {templates: 'templates'});
        expect(EntitiesAPI.get).toHaveBeenCalledWith('123');
        expect(state.entityView.entity).toEqual(entities[0]);
        expect(state.relationships.list.entityId).toBe('sid');
        expect(state.relationships.list.entity).toEqual({_id: 1, sharedId: 'sid'});
        expect(state.relationships.list.connectionsGroups).toBe('connectionsGroups');
        expect(state.relationships.list.searchResults).toBe('searchResults');
        expect(state.relationships.list.sort).toBe('sort');
        expect(state.relationships.list.filters).toBe('filters');
        expect(state.relationships.list.view).toBe('graph');
        expect(state.relationTypes).toEqual(relationTypes);
        done();
      });
    });

    describe('componentWillUnmount()', () => {
      it('should unset the state', () => {
        const context = {store: {dispatch: jasmine.createSpy('dispatch')}};
        const component = shallow(<EntityView params={{entityId: 123}} />, {context});
        component.instance().componentWillUnmount();
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'entityView/entity/UNSET'});
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'RELATIONSHIPS_EMPTY_STATE'});
      });
    });

    describe('setReduxState()', () => {
      beforeEach(() => {
        spyOn(formActions, 'merge').and.returnValue('fromActions/merge');
      });

      it('should set the redux state', () => {
        const context = {store: {dispatch: jasmine.createSpy('dispatch')}};
        const component = shallow(<EntityView params={{entityId: 123}} />, {context});
        const state = {
          relationTypes: 'relationTypes',
          entityView: {
            entity: 'entityView/entity'
          }
        };

        component.instance().setReduxState(state);

        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SHOW_TAB', tab: 'info'});
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'relationTypes/SET', value: 'relationTypes'});
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'entityView/entity/SET', value: 'entityView/entity'});
        expect(relationships.setReduxState).toHaveBeenCalledWith(state);
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'RELATIONSHIPS_SET_REDUX_STATE'});
      });
    });
  });
});
