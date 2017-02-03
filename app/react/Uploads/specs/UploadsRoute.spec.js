import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config';
import UploadsRoute from 'app/Uploads/UploadsRoute';
import RouteHandler from 'app/App/RouteHandler';
import * as actionTypes from 'app/Uploads/actions/actionTypes.js';

describe('UploadsRoute', () => {
  let documents = [{title: 'Something to publish'}, {title: 'My best recipes'}];
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
    .get(APIURL + 'search/unpublished', {body: JSON.stringify({rows: documents})});
  });

  afterEach(() => backend.restore());

  describe('static requestState()', () => {
    it('should request unpublished documents, templates and thesauris', (done) => {
      UploadsRoute.requestState()
      .then((state) => {
        expect(state.uploads.documents).toEqual(documents);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    beforeEach(() => {
      instance.setReduxState({uploads: {documents}});
    });

    it('should call setDocuments with the documents', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: actionTypes.SET_UPLOADS, documents});
    });
  });
});
