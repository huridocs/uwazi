import React from 'react';
import EntityView from '../EntityView';
import {shallow} from 'enzyme';
import EntitiesAPI from '../EntitiesAPI';
import ReferencesAPI from 'app/Viewer/referencesAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import referencesUtils from 'app/Viewer/utils/referencesUtils';

describe('EntityView', () => {
  describe('requestState', () => {
    let entities = [{_id: 1}];
    let references = [{_id: 1, text: 'Something'}];
    let templates = [{_id: 1, name: 'Decision'}];
    let thesauris = [{_id: 1, name: 'Countries'}];
    let relationTypes = [{_id: 1, name: 'against'}];

    beforeEach(() => {
      spyOn(EntitiesAPI, 'get').and.returnValue(Promise.resolve(entities));
      spyOn(ReferencesAPI, 'get').and.returnValue(Promise.resolve(references));
      spyOn(TemplatesAPI, 'get').and.returnValue(Promise.resolve(templates));
      spyOn(ThesaurisAPI, 'get').and.returnValue(Promise.resolve(thesauris));
      spyOn(RelationTypesAPI, 'get').and.returnValue(Promise.resolve(relationTypes));
      spyOn(referencesUtils, 'filterRelevant').and.returnValue(['filteredReferences']);
    });

    it('should get the entity, templates, and thesauris', (done) => {
      EntityView.requestState({entityId: '123', lang: 'es'})
      .then((state) => {
        expect(referencesUtils.filterRelevant).toHaveBeenCalledWith(references, 'es');
        expect(EntitiesAPI.get).toHaveBeenCalledWith('123');
        expect(state.entityView.entity).toEqual(entities[0]);
        expect(state.entityView.references).toEqual(['filteredReferences']);
        expect(state.templates).toEqual(templates);
        expect(state.thesauris).toEqual(thesauris);
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
