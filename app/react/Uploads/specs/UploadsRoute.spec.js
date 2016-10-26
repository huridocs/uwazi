import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config';
import UploadsRoute from 'app/Uploads/UploadsRoute';
import RouteHandler from 'app/App/RouteHandler';
import * as actionTypes from 'app/Uploads/actions/actionTypes.js';

describe('UploadsRoute', () => {
  let documents = [{title: 'Something to publish'}, {title: 'My best recipes'}];
  let templates = [{name: 'Decision', _id: 'abc1', properties: []}, {name: 'Ruling', _id: 'abc2', properties: []}];
  let thesauris = [{name: 'countries', _id: '1', values: []}];
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
    .mock(APIURL + 'search/unpublished', 'GET', {body: JSON.stringify({rows: documents})})
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: templates})})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify({rows: thesauris})});
  });

  describe('static requestState()', () => {
    it('should request unpublished documents, templates and thesauris', (done) => {
      UploadsRoute.requestState()
      .then((state) => {
        expect(state.uploads.documents).toEqual(documents);
        expect(state.templates).toEqual(templates);
        expect(state.thesauris).toEqual(thesauris);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    beforeEach(() => {
      instance.setReduxState({uploads: {documents}, templates, thesauris});
    });

    it('should call setDocuments with the documents', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: actionTypes.SET_UPLOADS, documents});
    });

    it('should call setTemplates with the templates', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'templates/SET', value: templates});
    });

    it('should call setThesauris with the thesauris', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'thesauris/SET', value: thesauris});
    });
  });
});
