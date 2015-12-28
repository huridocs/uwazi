import React, { Component, PropTypes } from 'react'
import Upload from '../Upload';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'

import superagent from 'superagent';
import superagentMock from 'superagent-mocker';

describe('Upload', () => {

  let component;
  let file = new File([], 'fighting__crime--101.pdf');
  let mock = superagentMock(superagent);

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL+'documents', 'POST', {body: JSON.stringify({ok: true, id: "1234", rev: "567"})})
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

    it('should upload the file with the document id', () => {
      let uploadRequest = component.uploadFile(file, {ok: true, id: "1234", rev: "567"})
      expect(uploadRequest._formData.get('document')).toBe("1234");
      expect(uploadRequest._formData.get('file')).toEqual(file);
    });

    it('should update the status with the progress', () => {
      let uploadRequest = component.uploadFile(file, {ok: true, id: "1234", rev: "567"})
      uploadRequest._callbacks.progress[0]({percent: 51});
      expect(component.state.progress).toBe(51);
    });
  });

});
