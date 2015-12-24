import React, { Component, PropTypes } from 'react'
import Library from '../Library';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'

describe('TemplatesController', () => {

  let documents = [{key:'secret documents'}, {key:'real batman id'}];
  let component;

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL+'documents', 'GET', {body: JSON.stringify({rows:documents})});
  });

  describe('static requestState', () => {
    it('should request documents', (done) => {
      Library.requestState()
      .then((response) => {
        expect(response.documents).toEqual(documents);
        done();
      })
      .catch(done.fail)
    });
  });

});
