import React, { Component, PropTypes } from 'react'
import Library from '../Library';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'
import {events} from '../../../utils/index'
import Provider from '../../App/Provider'

describe('LibraryController', () => {

  let documents = [{key:'secret documents', value:{}}, {key:'real batman id', value:{}}];
  let component;

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL+'documents', 'GET', {body: JSON.stringify({rows:documents})})
  });

  describe('static requestState', () => {
    it('should request documents and templates', (done) => {
      Library.requestState()
      .then((response) => {
        expect(response.documents).toEqual(documents);
        done();
      })
      .catch(done.fail)
    });
  });
});
