import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config.js';
import RouteHandler from 'app/App/RouteHandler';
import Viewer from 'app/Viewer/components/Viewer';
import ViewDocument from 'app/Viewer/ViewDocument';

describe('ViewDocument', () => {
  let templates = {rows: [{name: 'Decision', _id: 'abc1', properties: []}, {name: 'Ruling', _id: 'abc2', properties: []}]};
  let thesauris = {rows: [{name: 'countries', _id: '1', values: []}]};
  let documents = {rows: [{title: 'A', _id: '1'}, {title: 'B', _id: '2'}]};
  let relationTypes = {rows: [{name: 'Supports', _id: '1'}]};
  let document = {_id: '1', title: 'title'};
  let docHTML = {_id: '2', html: 'html'};
  let references = [{_id: '1', targetDocument: '1'}, {_id: '2', targetDocument: '2'}];
  let inboundReferences = [{_id: '3', targetDocument: '3'}, {_id: '4', targetDocument: '4'}];
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
    .mock(APIURL + 'relationtypes', 'GET', {body: JSON.stringify(relationTypes)})
    .mock(APIURL + 'documents?_id=documentId', 'GET', {body: JSON.stringify({rows: [document]})})
    .mock(APIURL + 'documents/list?keys=%5B%221%22%2C%222%22%5D', 'GET', {body: JSON.stringify(documents)})
    .mock(APIURL + 'documents/html?_id=documentId', 'GET', {body: JSON.stringify(docHTML)})
    .mock(APIURL + 'references?sourceDocument=documentId', 'GET', {body: JSON.stringify({rows: references})})
    .mock(APIURL + 'references/by_target_document/documentId', 'GET', {body: JSON.stringify({rows: inboundReferences})});
  });

  it('should render the Viewer', () => {
    expect(component.find(Viewer).length).toBe(1);
  });

  describe('static requestState', () => {
    it('should request for the document passed, the thesauris and return an object to fit in the state', (done) => {
      ViewDocument.requestState({documentId: 'documentId'})
      .then((state) => {
        let documentResponse = state.documentViewer.doc;
        let html = state.documentViewer.docHTML;
        let referencesResponse = state.documentViewer.references;
        let inboundReferencesResponse = state.documentViewer.inboundReferences;
        let templatesResponse = state.documentViewer.templates;
        let thesaurisResponse = state.documentViewer.thesauris;
        let relationTypesResponse = state.documentViewer.relationTypes;
        let documentsResponse = state.documentViewer.referencedDocuments;

        expect(documentResponse._id).toBe('1');
        expect(html).toEqual(docHTML);
        expect(referencesResponse).toEqual(references);
        expect(inboundReferencesResponse).toEqual(inboundReferences);
        expect(templatesResponse).toEqual(templates.rows);
        expect(thesaurisResponse).toEqual(thesauris.rows);
        expect(relationTypesResponse).toEqual(relationTypes.rows);
        expect(documentsResponse).toEqual(documents.rows);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState({
        documentViewer:
        {
          doc: 'doc',
          docHTML: 'docHTML',
          references: 'references',
          inboundReferences: 'inboundReferences',
          templates: 'templates',
          thesauris: 'thesauris',
          relationTypes: 'relationTypes',
          referencedDocuments: 'referencedDocuments'
        }
      });

      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_REFERENCES', references: 'references'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/doc/SET', value: 'doc'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/inboundReferences/SET', value: 'inboundReferences'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/docHTML/SET', value: 'docHTML'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/templates/SET', value: 'templates'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/thesauris/SET', value: 'thesauris'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/relationTypes/SET', value: 'relationTypes'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/referencedDocuments/SET', value: 'referencedDocuments'});
    });
  });

  describe('emptyState()', () => {
    it('should unset the state', () => {
      instance.emptyState();
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_REFERENCES', references: []});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/doc/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/inboundReferences/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/docHTML/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/templates/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/thesauris/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/relationTypes/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/referencedDocuments/UNSET'});
    });
  });
});
