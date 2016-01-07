import React, { Component, PropTypes } from 'react'
import Library from '../Library';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'
import {events} from '../../../utils/index'

describe('LibraryController', () => {

  let documents = [{key:'secret documents'}, {key:'real batman id'}];
  let templates = [{value: {name:'batarang', fields:[]}}, {value: {name:'batmovil'}}];
  let component;

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL+'documents', 'GET', {body: JSON.stringify({rows:documents})})
    .mock(APIURL+'templates', 'GET', {body: JSON.stringify({rows:templates})});
  });

  describe('static requestState', () => {
    it('should request documents and templates', (done) => {
      Library.requestState()
      .then((response) => {
        expect(response.documents).toEqual(documents);
        expect(response.templates).toEqual(templates);
        expect(response.template).toEqual(templates[0].value);
        done();
      })
      .catch(done.fail)
    });
  });

});
