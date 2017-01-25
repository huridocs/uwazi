import React from 'react';
import EntityView from '../EntityView';
import {shallow} from 'enzyme';
import EntitiesAPI from '../EntitiesAPI';
import ReferencesAPI from 'app/Viewer/referencesAPI';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import referencesUtils from 'app/Viewer/utils/referencesUtils';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';


describe('EntityView', () => {
  describe('requestState', () => {
    let entities = [{_id: 1}];
    let references = [{_id: 1, text: 'Something'}];
    let relationTypes = [{_id: 1, name: 'against'}];
    let relevantReferences;

    beforeEach(() => {
      spyOn(EntitiesAPI, 'get').and.returnValue(Promise.resolve(entities));
      spyOn(ReferencesAPI, 'get').and.returnValue(Promise.resolve(references));
      spyOn(RelationTypesAPI, 'get').and.returnValue(Promise.resolve(relationTypes));
      spyOn(prioritySortingCriteria, 'get').and.returnValue({sort: 'priorized'});

      relevantReferences = [{connectedDocumentTemplate: 't1'}, {connectedDocumentTemplate: 't3'}];
      spyOn(referencesUtils, 'filterRelevant').and.returnValue(relevantReferences);
    });

    it('should get the entity, references and the priority sort criteria', (done) => {
      EntityView.requestState({entityId: '123', lang: 'es'}, null, {templates: 'templates'})
      .then((state) => {
        expect(referencesUtils.filterRelevant).toHaveBeenCalledWith(references, 'es');

        const expectedSortCall = {currentCriteria: {}, filteredTemplates: ['t1', 't3'], templates: 'templates'};
        expect(prioritySortingCriteria.get).toHaveBeenCalledWith(expectedSortCall);

        expect(EntitiesAPI.get).toHaveBeenCalledWith('123');
        expect(state.entityView.entity).toEqual(entities[0]);
        expect(state.entityView.references).toBe(relevantReferences);
        expect(state.entityView.sort).toEqual({sort: 'priorized'});
        expect(state.relationTypes).toEqual(relationTypes);
        done();
      });
    });

    describe('emptyState()', () => {
      it('should unset the state', () => {
        let context = {store: {dispatch: jasmine.createSpy('dispatch')}};
        let component = shallow(<EntityView params={{entityId: 123}} />, {context});
        component.instance().emptyState();
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'entityView/entity/UNSET'});
        expect(context.store.dispatch).toHaveBeenCalledWith({type: 'entityView/references/UNSET'});
      });
    });
  });
});
