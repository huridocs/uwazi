import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config.js';
import Viewer from 'app/Viewer/components/Viewer';
import ViewDocument from 'app/Viewer/ViewDocument';
import referencesUtils from 'app/Viewer/utils/referencesUtils';

describe('ViewDocument', () => {
  let templates = {rows: [{name: 'Decision', _id: 'abc1', properties: []}, {name: 'Ruling', _id: 'abc2', properties: []}]};
  let thesauris = {rows: [{name: 'countries', _id: '1', values: []}]};
  let relationTypes = {rows: [{name: 'Supports', _id: '1'}]};
  let document = {_id: '1', title: 'title', pdfInfo: 'info'};
  let docHTML = {_id: '2', html: 'html'};
  let references = [{_id: '1', connectedDocument: '1'}, {_id: '2', connectedDocument: '2'}];
  let component;
  let instance;
  let context;

  beforeEach(() => {
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<ViewDocument renderedFromServer={true} />, {context});
    instance = component.instance();

    spyOn(referencesUtils, 'filterRelevant').and.returnValue(['filteredReferences']);

    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify(templates)})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify(thesauris)})
    .mock(APIURL + 'relationtypes', 'GET', {body: JSON.stringify(relationTypes)})
    .mock(APIURL + 'documents?_id=documentId', 'GET', {body: JSON.stringify({rows: [document]})})
    .mock(APIURL + 'documents/html?_id=documentId', 'GET', {body: JSON.stringify(docHTML)})
    .mock(APIURL + 'references/by_document/documentId', 'GET', {body: JSON.stringify(references)});
  });

  it('should render the Viewer', () => {
    expect(component.find(Viewer).length).toBe(1);
  });

  describe('static requestState', () => {
    it('should request for the document passed, the thesauris and return an object to populate the state', (done) => {
      ViewDocument.requestState({documentId: 'documentId', lang: 'es'})
      .then((state) => {
        let documentResponse = state.documentViewer.doc;
        let templatesResponse = state.documentViewer.templates;
        let thesaurisResponse = state.documentViewer.thesauris;
        let relationTypesResponse = state.documentViewer.relationTypes;

        expect(documentResponse._id).toBe('1');
        expect(templatesResponse).toEqual(templates.rows);
        expect(thesaurisResponse).toEqual(thesauris.rows);
        expect(relationTypesResponse).toEqual(relationTypes.rows);

        expect(state.relationTypes).toEqual(relationTypes.rows);

        expect(state.templates).toEqual(templates.rows);
        expect(state.thesauris).toEqual(thesauris.rows);
        done();
      })
      .catch(done.fail);
    });

    it('should filter the relevant language and by-source references', (done) => {
      ViewDocument.requestState({documentId: 'documentId', lang: 'es'})
      .then((state) => {
        let referencesResponse = state.documentViewer.references;

        expect(referencesUtils.filterRelevant).toHaveBeenCalledWith(references, 'es');
        expect(referencesResponse).toEqual(['filteredReferences']);
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
          references: 'references',
          templates: 'templates',
          thesauris: 'thesauris',
          relationTypes: 'relationTypes'
        },
        relationTypes: 'relationTypes'
      });

      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'relationTypes/SET', value: 'relationTypes'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_REFERENCES', references: 'references'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/doc/SET', value: 'doc'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/templates/SET', value: 'templates'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/thesauris/SET', value: 'thesauris'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/relationTypes/SET', value: 'relationTypes'});

      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'templates/SET', value: 'templates'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'thesauris/SET', value: 'thesauris'});
    });
  });

  describe('componentWillUnmount()', () => {
    it('should call emptyState', () => {
      spyOn(instance, 'emptyState');
      instance.componentWillUnmount();

      expect(instance.emptyState).toHaveBeenCalled();
    });
  });

  describe('emptyState()', () => {
    it('should unset the state', () => {
      instance.emptyState();
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_REFERENCES', references: []});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/doc/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/templates/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/thesauris/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/relationTypes/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'rrf/reset', model: 'documentViewer.tocForm'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/targetDoc/UNSET'});
    });
  });
});
