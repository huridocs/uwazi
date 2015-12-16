import React, { Component, PropTypes } from 'react'
import TemplatesController from '../TemplatesController';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'

describe('TemplatesController', () => {

  let templatesResponse = [{key:'template1'}, {key:'template2'}];
  let component;

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL+'templates', 'GET', {body: JSON.stringify({rows:templatesResponse})});
  });

  describe('static requestState', () => {
    it('should request templates and find template based on the key passed', (done) => {
      let key = 'template1';
      TemplatesController.requestState(key)
      .then((response) => {
        expect(response.templates).toEqual(templatesResponse);
        expect(response.template).toEqual(templatesResponse[0]);
        done();
      })
      .catch(done.fail)
    });

  });

  describe('on instance', () => {

  });
});
