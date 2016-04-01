import React from 'react';
import Library from '../Library';
import backend from 'fetch-mock';
import TestUtils from 'react-addons-test-utils';
import {APIURL} from '../../../config.js';
import api from '../../../utils/singleton_api';
import MockProvider from '../../App/specs/MockProvider';

describe('LibraryController', () => {
  let documents = [{key: 'secret documents', value: {}}, {key: 'real batman id', value: {}}];
  let searchDocuments = [{key: 'doc1', value: {}}, {key: 'doc2', value: {}}];
  let templates = [{key: 'template1'}, {key: 'template2'}];
  let component;

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'documents/newest', 'GET', {body: JSON.stringify({rows: documents})})
    .mock(APIURL + 'documents/relevant', 'GET', {body: JSON.stringify({rows: documents})})
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: templates})})
    .mock(APIURL + 'documents/search?searchTerm=searchTerm', 'GET', {body: JSON.stringify(searchDocuments)});

    let params = {};
    TestUtils.renderIntoDocument(<MockProvider><Library params={params} ref={(ref) => component = ref} /></MockProvider>);
  });

  describe('static requestState()', () => {
    fit('should request newest, and relevant documents, and templates', (done) => {
      Library.requestState(null, api)
      .then((response) => {
        expect(response.newest).toEqual(documents);
        expect(response.relevant).toEqual(documents);
        expect(response.templates).toEqual(templates);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should request documents', (done) => {
      component.search('searchTerm')
      .then(() => {
        expect(component.state.searchResult).toEqual(searchDocuments);
        done();
      })
      .catch(done.fail);
    });

    it('should show the search results', (done) => {
      component.searchField = {value: 'searchTerm'};

      component.search('searchTerm')
      .then(() => {
        expect(component.state.show).toEqual('searchResult');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('showRelevant()', () => {
    it('should set state.documents to the relevant ones', () => {
      component.showRelevant();
      expect(component.state.show).toEqual('relevant');
    });
  });

  describe('showNewest()', () => {
    it('should set state.documents to the relevant ones', () => {
      component.showNewest();
      expect(component.state.show).toEqual('newest');
    });
  });

  describe('showSearchResult()', () => {
    it('should set state.documents to the search result', () => {
      component.showSearchResult();
      expect(component.state.show).toEqual('searchResult');
    });
  });
});
