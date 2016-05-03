import React from 'react';
import RouteHandler from '../RouteHandler';
import backend from 'fetch-mock';
import TestUtils from 'react-addons-test-utils';
import {APIURL} from '../../../config.js';
import api from '../../../utils/api';
import Provider from '../Provider';
import TestController from './TestController';

describe('deprecated RouteHandler', () => {
  let component;

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: []})});
    delete window.__initialData__;
  });

  describe('static requestState', () => {
    it('should return a promise with an empty object', (done) => {
      RouteHandler.requestState()
      .then((response) => {
        expect(response).toEqual({});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('on instance', () => {
    let initialData = {batmanGadgets: ['batimovil', 'batarang']};

    describe('when getInitialData returns data', () => {
      beforeEach(() => {
        TestUtils.renderIntoDocument(
          <Provider initialData={initialData} >
          <TestController ref={(ref) => component = ref} />
          </Provider>
        );
      });

      it('should not call to requestState', () => {
        spyOn(TestController, 'requestState');
        expect(TestController.requestState).not.toHaveBeenCalled();
      });

      it('should use getInitialData to set the initial state', () => {
        expect(component.state).toEqual(initialData);
      });
    });

    describe('when getInitialData returns no data', () => {
      let params = {id: 'id'};

      beforeEach(() => {
        spyOn(TestController, 'requestState').and.callThrough();
        TestUtils.renderIntoDocument(
          <Provider>
            <TestController params={params} ref={(ref) => component = ref} />
          </Provider>
        );
      });

      it('should request for initialState and set it on the state', (done) => {
        TestController.requestState().then(() => {
          expect(component.state.initialData).toBe('data');
          done();
        })
        .catch(done.fail);
      });

      it('should send props.params to requestState', (done) => {
        // WTF !!
        TestController.requestState().then(() => {
          expect(TestController.requestState).toHaveBeenCalledWith(params, api);
          done();
        })
        .catch(done.fail);
      });

      it('should set the empty state', () => {
        expect(component.state).toEqual({message: 'requesting data'});
      });
    });
  });
});
