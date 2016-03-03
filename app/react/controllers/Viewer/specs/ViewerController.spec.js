import React, { Component, PropTypes } from 'react'
import ViewerController from '../ViewerController';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'
import Provider from '../../App/Provider'
import api from '../../../utils/singleton_api'
import TextRange from 'batarange'
import {events} from '../../../utils/index'

describe('ViewerController', () => {

  let documentResponse = [{key:'doc1', id:'1', value:{pages:[], css:[], template: 1}}];
  let templateResponse = [{}];

  let component;

  beforeEach(() => {
    let initialData = {};
    let params = {};
    let history = {};
    TestUtils.renderIntoDocument(<Provider><ViewerController history={history} params={params} ref={(ref) => component = ref} /></Provider>);
    backend.restore();
    backend
    .mock(APIURL+'documents?_id=1', 'GET', {body: JSON.stringify({rows:documentResponse})})
    .mock(APIURL+'templates?key=1', 'GET', {body: JSON.stringify({rows:templateResponse})})
    .mock(APIURL+'references?sourceDocument=1', 'GET', {body: JSON.stringify({rows:[{title:1}]})})
    .mock(APIURL+'references', 'POST', {body: JSON.stringify({})});
  });

  describe('static requestState', () => {
    it('should request the document, the references and the template', (done) => {
      let id = 1;
      ViewerController.requestState({documentId:id}, api)
      .then((response) => {
        expect(response).toEqual({value: documentResponse[0].value, references: [{title:1}], template: templateResponse[0]});
        done();
      })
      .catch(done.fail)
    });
  });

  describe('saveReference', () => {

    it('should save the reference', () => {
      spyOn(component.document, 'getReference').and.returnValue({reference:'reference'});

      component.document.createReference();
      expect(backend.calls().matched[0][1].body).toBe(JSON.stringify({reference:'reference'}));
      expect(backend.calls().matched[0][0]).toBe(APIURL+'references');
    });

    describe('on success', () => {
      it('should render the reference on the document', (done) => {
        spyOn(component.document, 'wrapReference');

        component.saveReference({reference: 'reference'})
        .then(() => {
          expect(component.document.wrapReference).toHaveBeenCalledWith({reference:'reference'});
          done();
        });
      });

      it('should close document modal', () => {
        spyOn(component.document, 'closeModal');

        component.saveReference({reference: 'reference'})
        .then(() => {
          expect(component.document.closeModal).toHaveBeenCalled();
          done();
        });
      });

      it('should emit a success alert', (done) => {

        let eventType, eventMessage;
        events.on('alert', (type, message) => {
          eventType = type;
          eventMessage = message;
        });

        component.saveReference({})
        .then(() => {
          expect(eventType).toBe('success');
          expect(eventMessage).toBe('Reference created.');
          done();
        });
      });
    });

  });

});
