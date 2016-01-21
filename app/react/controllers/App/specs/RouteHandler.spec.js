import React, { Component, PropTypes } from 'react'
import RouteHandler from '../RouteHandler';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../config.js'
import Provider from '../Provider'

describe('RouteHandler', () => {

  let component;

  class TestController extends RouteHandler {

    static emptyState() {
      return {message: 'requesting data'};
    };

    static requestState () {
      return Promise.resolve({initialData:'data'});
    };

    render = () => {return <div/>};
  }

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL+'templates', 'GET', {body: JSON.stringify({rows:[]})});
    window.__initialData__ = undefined;
  });

  describe('static requestState', () => {
    it('should return a promise with an empty object', (done) => {

      RouteHandler.requestState()
      .then((response) => {
        expect(response).toEqual({});
        done();
      })
      .catch(done.fail)

    });

  });

  describe('on instance', () => {

    let component;
    let initialData = {batmanGadgets:['batimovil', 'batarang']};

    describe('when getInitialData returns data', () => {
      beforeEach(() => {
        TestUtils.renderIntoDocument(<Provider initialData={initialData} ><TestController ref={(ref) => component = ref} /></Provider>);
      });

      it("should not call to requestState", () => {
        spyOn(TestController, 'requestState');
        expect(TestController.requestState).not.toHaveBeenCalled();
      });

      it('should use getInitialData to set the initial state', () => {
        expect(component.state).toEqual(initialData);
      });
    });

    describe('when getInitialData returns no data', () => {
      let params = {id:'id'};

      beforeEach(() => {
        spyOn(TestController, 'requestState').and.callThrough();
        TestUtils.renderIntoDocument(<Provider><TestController params={params} ref={(ref) => component = ref} /></Provider>);
      });

      it('should request for initialState and set it on the state', (done) => {
        TestController.requestState().then(() => {
            expect(component.state.initialData).toBe('data');
            done();
        })
        .catch(done.fail);
      });

      it("should send props.params to requestState", (done) => {
        TestController.requestState().then(() => {
            expect(TestController.requestState).toHaveBeenCalledWith(params);
            done();
        })
        .catch(done.fail);
      });

      it('should set the empty state', function(){
        expect(component.state).toEqual({message: 'requesting data'});
      })
    });
  });
});
