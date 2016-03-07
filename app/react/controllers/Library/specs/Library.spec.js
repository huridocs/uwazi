import React, { Component, PropTypes } from 'react'
import Library from '../Library';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'
import {events} from '../../../utils/index'
import  api from '../../../utils/singleton_api'
import Provider from '../../App/Provider'

describe('LibraryController', () => {

  let documents = [{key:'secret documents', value:{}}, {key:'real batman id', value:{}}];
  let searchDocuments = [{key:'doc1', value:{}}, {key:'doc2', value:{}}];
  let templates = [{key: 'template1'}, {key: 'template2'}]
  let component;

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL+'documents/newest', 'GET', {body: JSON.stringify({rows: documents})})
    .mock(APIURL+'documents/relevant', 'GET', {body: JSON.stringify({rows: documents})})
    .mock(APIURL+'templates', 'GET', {body: JSON.stringify({rows: templates})})
    .mock(APIURL+'documents/search?searchTerm=searchTerm', 'GET', {body: JSON.stringify(searchDocuments)})

    let params = {};
    TestUtils.renderIntoDocument(<Provider><Library params={params} ref={(ref) => component = ref} /></Provider>);
  });

  describe('static requestState()', () => {
    it('should request newest, and relevant documents, and templates', (done) => {
      Library.requestState(null, api)
      .then((response) => {
        expect(response.newest).toEqual(documents);
        expect(response.relevant).toEqual(documents);
        expect(response.templates).toEqual(templates);
        done();
      })
      .catch(done.fail)
    });
  });

  describe('search()', () => {
    it('should request documents', (done) => {
      component.searchField = {value:'searchTerm'};

      component.search({preventDefault:() => {}})
      .then(() => {
        expect(component.state.search_result).toEqual(searchDocuments);
        done();
      })
      .catch(done.fail)
    });

    it('should show the search results', (done) => {
      component.searchField = {value:'searchTerm'};

      component.search({preventDefault:() => {}})
      .then(() => {
        expect(component.state.show).toEqual('search_result');
        done();
      })
      .catch(done.fail)
    })
  });

  describe('showRelevant()', () => {
    it('should set state.documents to the relevant ones', () => {
      component.showRelevant();
      expect(component.state.show).toEqual('relevant');
    });
  })

  describe('showNewest()', () => {
    it('should set state.documents to the relevant ones', () => {
      component.showNewest();
      expect(component.state.show).toEqual('newest');
    });
  })

  describe('showSearchResult()', () => {
    it('should set state.documents to the search result', () => {
      component.showSearchResult();
      expect(component.state.show).toEqual('search_result');
    });
  })

});
