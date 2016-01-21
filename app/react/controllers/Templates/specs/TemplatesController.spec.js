import React, { Component, PropTypes } from 'react'
import TemplatesController from '../TemplatesController';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'
import Provider from '../../../core/Provider'

describe('TemplatesController', () => {

  let templatesResponse = [{key:'template1', id:'1', value:{}}, {key:'template2', id:'2', value:{}}];

  let component;

  beforeEach(() => {
    let initialData = {};
    let params = {};
    TestUtils.renderIntoDocument(<Provider initialData={initialData}><TemplatesController params={params} ref={(ref) => component = ref} /></Provider>);
    backend.restore();
    backend
    .mock(APIURL+'templates', 'GET', {body: JSON.stringify({rows:templatesResponse})})
    .mock(APIURL+'templates', 'POST', {body: JSON.stringify({id:'2'})});
  });

  describe('static requestState', () => {
    it('should request templates and find template based on the key passed', (done) => {
      let id = '1';
      TemplatesController.requestState({templateKey:id})
      .then((response) => {
        expect(response.templates).toEqual(templatesResponse);
        expect(response.template).toEqual(templatesResponse[0]);
        done();
      })
      .catch(done.fail)
    });
  });

  describe("saveForm()", () => {
    it("should save form and refresh the template list", (done) => {

      component.saveForm({name:'saving template'})
      .then(() => {

        let calls = backend.calls(APIURL+'templates');

        expect(calls[0][1].method).toBe('POST');
        expect(calls[0][1].body).toEqual(JSON.stringify({name:'saving template'}));

        expect(calls[1][1].method).toBe('GET');

        expect(component.state.template.key).toBe('template2');

        done();
      })
      .catch(done.fail)

    });
  });

});
