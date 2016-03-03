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
  let newDocument = [{key:'doc2', id:'1', value:{ doc: 'doc2', pages:[], css:[], template: 1}}];
  let templateResponse = [{value:{}}];

  let component;

  beforeEach(() => {
    let initialData = {};
    let params = {documentId: '1'};
    let history = {};
    TestUtils.renderIntoDocument(<Provider><ViewerController history={history} params={params} ref={(ref) => component = ref} /></Provider>);
    backend.restore();
    backend
    .mock(APIURL+'documents?_id=1', 'GET', {body: JSON.stringify({rows:documentResponse})})
    .mock(APIURL+'documents?_id=newId', 'GET', {body: JSON.stringify({rows: newDocument})})
    .mock(APIURL+'templates?key=1', 'GET', {body: JSON.stringify({rows:templateResponse})})
    .mock(APIURL+'references?sourceDocument=1', 'GET', {body: JSON.stringify({rows:[{title:1}]})})
    .mock(APIURL+'references?sourceDocument=newId', 'GET', {body: JSON.stringify( { rows:[ {value:{title:'new'}} ] })})
    .mock(APIURL+'references', 'POST', {body: JSON.stringify({id:'newReferenceId'})});
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

  describe('componentWillReceiveProps', () => {
    describe('when new documentId is sent', () => {
      it('should request the new state', (done) => {
        spyOn(component, 'setState').and.callThrough();
        component.componentWillReceiveProps({params:{documentId: 'newId'}})
        .then(() => {
          expect(component.state.value.doc).toBe('doc2');
          done();
        })
        .catch(done.fail);

        expect(component.setState).toHaveBeenCalledWith(ViewerController.emptyState());
      });
    });

    describe('when documentId is the same', () => {
      it('should return false', () => {
        expect(component.componentWillReceiveProps({params:{documentId:'1'}})).toBe(false);
      });
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
      it('should add the reference on the document', (done) => {
        spyOn(component.document, 'addReference');

        component.saveReference({reference: 'reference'})
        .then(() => {
          expect(component.document.addReference).toHaveBeenCalledWith({value: {_id:'newReferenceId', reference:'reference'}});
          done();
        })
        .catch(done.fail);

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
        })
        .catch(done.fail);
      });
    });

  });

  });
