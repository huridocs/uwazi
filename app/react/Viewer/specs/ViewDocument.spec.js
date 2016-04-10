import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config.js';
import RouteHandler from 'app/controllers/App/RouteHandler';
import Viewer from 'app/Viewer/components/Viewer';
import ViewDocument from 'app/Viewer/ViewDocument';

describe('ViewDocument', () => {
  let document = {_id: '1', title: 'title'};
  let references = [{_id: '1'}, {_id: '2'}];
  let component;
  let instance;
  let context;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<ViewDocument />, {context});
    instance = component.instance();

    backend.restore();
    backend
    .mock(APIURL + 'documents?_id=documentId', 'GET', {body: JSON.stringify({rows: [document]})})
    .mock(APIURL + 'references?sourceDocument=documentId', 'GET', {body: JSON.stringify({rows: references})});
  });

  it('should render the Viewer', () => {
    expect(component.find(Viewer).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request for the template passed, the thesauris and return an object to fit in the state', (done) => {
      ViewDocument.requestState({documentId: 'documentId'})
      .then((response) => {
        let documentResponse = response.documentViewer.document;
        let referencesResponse = response.documentViewer.references.toJS();

        expect(documentResponse).toEqual(document);
        expect(referencesResponse).toEqual(references);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState({documentViewer: {document: 'document', references: 'references'}});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_REFERENCES', references: 'references'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_DOCUMENT', document: 'document'});
    });
  });
});
