import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config';
import UploadsRoute from 'app/Uploads/UploadsRoute';
import RouteHandler from 'app/App/RouteHandler';
import * as actionTypes from 'app/Library/actions/actionTypes.js';

describe('UploadsRoute', () => {
  let documents = [{title: 'Something to publish'}, {title: 'My best recipes'}];
  let aggregations = [{1: '23'}, {2: '123'}];
  let component;
  let instance;
  let context;
  let props = {};

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<UploadsRoute {...props}/>, {context});
    instance = component.instance();

    backend.restore();
    backend
    .get(APIURL + 'search?filters=%7B%7D&types=%5B%5D&order=desc&sort=creationDate&unpublished=true', {body: JSON.stringify({rows: documents})});
  });

  afterEach(() => backend.restore());

  describe('static requestState()', () => {
    it('should request unpublished documents, templates and thesauris', (done) => {
      UploadsRoute.requestState()
      .then((state) => {
        expect(state.uploads.documents).toEqual({rows: documents});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    beforeEach(() => {
      instance.setReduxState({uploads: {documents, filters: {}, aggregations}});
    });

    it('should call setDocuments with the documents', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: actionTypes.SET_DOCUMENTS, documents, __reducerKey: 'uploads'});
    });
  });
});
