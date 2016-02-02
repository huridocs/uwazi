import React, { Component, PropTypes } from 'react'
import Viewer from '../Viewer';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'

describe('Viewer', () => {

  let documentResponse = {key:'template1', id:'1', value:{pages:[], css:[]}};
  let component;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<Viewer documentId="1"/>);
    backend.restore();
    backend.mock(APIURL+'documents?_id=1', 'GET', {body: JSON.stringify({rows:[documentResponse]})});
  });

  describe('requestDocument()', () => {
    it('should request the document with the pros id and set in state', (done) => {
      component.requestDocument()
      .then(() => {
        expect(component.state).toEqual(documentResponse);
        done();
      })
      .catch(done.fail)
    });
  });

});
