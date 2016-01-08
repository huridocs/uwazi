import React, { Component, PropTypes } from 'react'
import Library from '../Library';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'
import {events} from '../../../utils/index'
import Provider from '../../../core/Provider'

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

  describe('when a new document is uploaded', () => {
    let doc = {id: 'id_1', value: {title: 'Robin secret diary'}};;

    beforeEach(() => {
      TestUtils.renderIntoDocument(<Provider><Library ref={(ref) => {component = ref}}/></Provider>);
      component.setState({documents: [{id: 'id_0', value: {title: 'Enigma answers'}}]})
    });

    it('should add the document first of the list', () => {
      events.emit('newDocument', doc);
      expect(component.state.documents[0]).toBe(doc);
    });

    it('should set the progress to the doc', () => {
      events.emit('newDocument', doc);
      events.emit('uploadProgress', 'id_1', 20);
      expect(component.state.documents[0].progress).toBe(20);
    })

    it('when it ends should set file to the doc', () => {
      let fileData = {filename: 'as1hd123ha', originalname: 'Engima answers'};
      events.emit('newDocument', doc);
      events.emit('uploadProgress', 'id_1', 20);
      events.emit('uploadEnd', 'id_1', {filename: 'as1hd123ha', originalname: 'Engima answers'});
      expect(component.state.documents[0].progress).not.toBeDefined();
      expect(component.state.documents[0].value.file).toEqual({filename: 'as1hd123ha', originalname: 'Engima answers'});
    })
  })

});
