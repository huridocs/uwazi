import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config.js';
import EditRelationType from 'app/RelationTypes/EditRelationType';
import RelationTypeForm from 'app/RelationTypes/components/RelationTypeForm';
import RouteHandler from 'app/App/RouteHandler';
import * as relationTypesActions from 'app/RelationTypes/actions/relationTypesActions';

describe('EditRelationType', () => {
  let relationType = {name: 'Against'};
  let component;
  let props = jasmine.createSpyObj(['editRelationType']);
  let context;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<EditRelationType {...props}/>, {context});

    backend.restore();
    backend
    .get(APIURL + 'relationtypes?_id=relationTypeId', {body: JSON.stringify({rows: [relationType]})});
  });

  afterEach(() => backend.restore());

  it('should render a RelationTypeForm', () => {
    expect(component.find(RelationTypeForm).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the relationTypes using the param relationTypeId', (done) => {
      EditRelationType.requestState({relationTypeId: 'relationTypeId'})
      .then((state) => {
        expect(state).toEqual({relationType});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      spyOn(relationTypesActions, 'editRelationType').and.returnValue('RELATION_TYPE_LOADED');
      component.instance().setReduxState({relationType});

      expect(relationTypesActions.editRelationType).toHaveBeenCalledWith(relationType);
      expect(context.store.dispatch).toHaveBeenCalledWith('RELATION_TYPE_LOADED');
    });
  });
});
