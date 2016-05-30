import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config.js';
import RouteHandler from 'app/controllers/App/RouteHandler';
import Viewer from 'app/Viewer/components/Viewer';
import ViewDocument from 'app/Viewer/ViewDocument';

describe('ViewDocument', () => {
  let templates = {rows: [{name: 'Decision', _id: 'abc1', properties: []}, {name: 'Ruling', _id: 'abc2', properties: []}]};
  let thesauris = {rows: [{name: 'countries', _id: '1', values: []}]};
  let document = {_id: '1', title: 'title'};
  let docHTML = {_id: '2', html: 'html'};
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
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify(templates)})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify(thesauris)})
    .mock(APIURL + 'documents?_id=documentId', 'GET', {body: JSON.stringify({rows: [document]})})
    .mock(APIURL + 'documents/html?_id=documentId', 'GET', {body: JSON.stringify(docHTML)})
    .mock(APIURL + 'references?sourceDocument=documentId', 'GET', {body: JSON.stringify({rows: references})});
  });

  it('should render the Viewer', () => {
    expect(component.find(Viewer).length).toBe(1);
  });

  describe('static requestState', () => {
    it('should request for the document passed, the thesauris and return an object to fit in the state', (done) => {
      ViewDocument.requestState({documentId: 'documentId'})
      .then((response) => {
        let documentResponse = response.documentViewer.doc;
        let html = response.documentViewer.docHTML;
        let referencesResponse = response.documentViewer.references;
        let templatesResponse = response.documentViewer.templates;
        let thesaurisResponse = response.documentViewer.thesauris;

        expect(documentResponse._id).toBe('1');
        expect(html).toEqual(docHTML);
        expect(referencesResponse).toEqual(references);
        expect(templatesResponse).toEqual(templates.rows);
        expect(thesaurisResponse).toEqual(thesauris.rows);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState({documentViewer:
                             {doc: 'doc', docHTML: 'docHTML', references: 'references', templates: 'templates', thesauris: 'thesauris'}
      });

      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_REFERENCES', references: 'references'});
      //expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_DOCUMENT', document: 'document', html: null});

      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/doc/SET', value: 'doc'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/docHTML/SET', value: 'docHTML'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/templates/SET', value: 'templates'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/thesauris/SET', value: 'thesauris'});
    });
  });
});
