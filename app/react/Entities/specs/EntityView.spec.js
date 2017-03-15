import React from 'react';
import EntityView from '../EntityView';
import {shallow} from 'enzyme';
import {actions as formActions} from 'react-redux-form';
import EntitiesAPI from '../EntitiesAPI';
import ReferencesAPI from 'app/Viewer/referencesAPI';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';


describe('EntityView', () => {
  describe('requestState', () => {
    let entities = [{_id: 1}];
    let groupedByConnection = [{templates: [{_id: 't1'}]}, {templates: [{_id: 't2'}, {_id: 't3'}]}];
    let searchedReferences = [{_id: 'r1'}, {_id: 'r2'}];
    let relationTypes = [{_id: 1, name: 'against'}];

    beforeEach(() => {
      spyOn(EntitiesAPI, 'get').and.returnValue(Promise.resolve(entities));
      spyOn(ReferencesAPI, 'getGroupedByConnection').and.returnValue(Promise.resolve(groupedByConnection));
      spyOn(ReferencesAPI, 'search').and.returnValue(Promise.resolve(searchedReferences));
      spyOn(RelationTypesAPI, 'get').and.returnValue(Promise.resolve(relationTypes));
      spyOn(prioritySortingCriteria, 'get').and.returnValue({sort: 'priorized'});
    });

    it('should get the entity, references and the priority sort criteria', (done) => {
      EntityView.requestState({entityId: '123', lang: 'es'}, null, {templates: 'templates'})
      .then((state) => {
        const expectedSortCall = {currentCriteria: {}, filteredTemplates: ['t1', 't2', 't3'], templates: 'templates'};
        expect(prioritySortingCriteria.get).toHaveBeenCalledWith(expectedSortCall);

        expect(EntitiesAPI.get).toHaveBeenCalledWith('123');
        expect(state.entityView.entity).toEqual(entities[0]);
        expect(state.connectionsList.connectionsGroups).toBe(groupedByConnection);
        expect(state.connectionsList.searchResults).toBe(searchedReferences);
        expect(state.connectionsList.sort).toEqual({sort: 'priorized'});
        expect(state.connectionsList.filters).toEqual({});
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
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'connectionsList/connectionsGroups/UNSET'});
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'connectionsList/searchResults/UNSET'});
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'connectionsList/filters/UNSET'});
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'connectionsList.sort/UNSET'});
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
          },
          connectionsList: {
            connectionsGroups: 'connectionsList/connectionsGroups',
            searchResults: 'connectionsList/searchResults',
            filters: 'connectionsList/filters',
            sort: 'connectionsList.sort'
          }
        };

        component.instance().setReduxState(state);

        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'entityView/entity/SET', value: 'entityView/entity'});
        expect(context.store.dispatch).toHaveBeenCalledWith(
          {type: 'connectionsList/connectionsGroups/SET', value: 'connectionsList/connectionsGroups'}
        );
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'connectionsList/searchResults/SET', value: 'connectionsList/searchResults'});
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'connectionsList/filters/SET', value: 'connectionsList/filters'});
        expect(formActions.merge).toHaveBeenCalledWith('connectionsList.sort', 'connectionsList.sort');
        expect(context.store.dispatch).toHaveBeenCalledWith('fromActions/merge');
      });
    });
  });
});
