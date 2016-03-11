import React, { Component, PropTypes } from 'react'
import Upload from '../Upload';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'
import {events} from '../../../utils/index'

import superagent from 'superagent';

describe('Upload', () => {

  let component;
  let file = new File([], 'fighting__crime--101.pdf');

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL+'documents', 'POST', {body: JSON.stringify({ok: true, id: '1234', rev: '567'})})
    .mock(APIURL+'upload', 'POST', {body: JSON.stringify({ok: true, id: '1234', rev: '567'})});
  });

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<Upload/>);
  });

  describe('upload()', () => {
    it('should reset the progress', () => {
      component.state.progress = 100;
      component.upload();
      expect(component.state.progress).toBe(0);
    })

    it('should uploadFile passing the recent created document with his id', (done) => {
      spyOn(component, 'getInputFile').and.returnValue({name:'name'});
      spyOn(component, 'uploadFile');

      component.upload()
      .then(() => {
        expect(component.uploadFile).toHaveBeenCalledWith({name:'name'}, {ok: true, id: '1234', rev: '567'});
        done();
      });
    })
  })

  describe('createDocument()', () => {
    it('should create a new document with the file title', (done) => {
      component.createDocument(file)
      .then(() => {
        expect(backend.calls().matched[0][0]).toBe(APIURL+'documents');
        expect(backend.calls().matched[0][1].body).toBe(JSON.stringify({title: 'Fighting crime 101'}));
        done()
      }).catch(done.fail);
    });
  });

  describe('uploadFile()', () => {

    beforeEach(() => {
      events.removeAllListeners('newDocument');
      events.removeAllListeners('uploadProgress');
      events.removeAllListeners('uploadEnd');
    })

    it('should upload the file with the document id', () => {
      let uploadRequest = component.uploadFile(file, {ok: true, id: '1234', rev: '567'})
      expect(uploadRequest._formData.get('document')).toBe('1234');
      expect(uploadRequest._formData.get('file')).toEqual(file);
    });

    it('should trigger the an event with the document info', function(done){
      let response = {ok: true, id: '1234', rev: '567'}
      events.on('newDocument', (docInfo) => {
        let expectedDoc = {id: '1234', rev: '567', value: {title:'Fighting crime 101', _id: '1234', _rev: '567'}}
        expect(docInfo).toEqual(expectedDoc);
        done();
      });

      component.uploadFile(file, response);
    });

    describe('on progress', () => {
      it('should update the status with the progress', () => {
        let uploadRequest = component.uploadFile(file, {ok: true, id: '1234', rev: '567'})
        uploadRequest._callbacks.progress[0]({percent: 51});
        expect(component.state.progress).toBe(51);
      });

      it('should emit an event with the progress and the doc id', (done) => {
        events.on('uploadProgress', (id, percent) => {
          expect(percent).toBe(51);
          expect(id).toBe('1234');
          done();
        })

        let uploadRequest = component.uploadFile(file, {ok: true, id: '1234', rev: '567'})
        uploadRequest._callbacks.progress[0]({percent: 51.02});
      });
    })

    describe('on complete', () => {
      it('should emit an event', (done) => {
        events.on('uploadEnd', (id, file) => {
          expect(id).toBe('1234');
          expect(file).toBe('fileData');
          done();
        })

        let uploadRequest = component.uploadFile(file, {ok: true, id: '1234', rev: '567'})
        uploadRequest._callbacks.response[0]({body: 'fileData'});
      });

      it('should set reset progress', (done) => {
        component.setState({progress: 100});
        events.on('uploadEnd', (id, file) => {
          expect(component.state.progress).toBe(0);
          done();
        })

        let uploadRequest = component.uploadFile(file, {ok: true, id: '1234', rev: '567'})
        uploadRequest._callbacks.response[0]({body: 'fileData'});
      });
    })
  });

});
