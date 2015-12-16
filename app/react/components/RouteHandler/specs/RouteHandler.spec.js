import React, { Component, PropTypes } from 'react'
import RouteHandler from '../RouteHandler';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'
import Provider from '../../../Provider'

describe('RouteHandler', () => {

  let templatesResponse = [{key:'template1'}, {key:'template2'}];
  let component;

  class TestController extends RouteHandler {
    static requestState () {
      return Promise.resolve({initialData:'data'});
    }

    render = () => {return <div/>}
  }

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL+'templates', 'GET', {body: JSON.stringify({rows:templatesResponse})});
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

    describe('when window.__initialData__ is set', () => {

      beforeEach(() => {
        window.__initialData__ = initialData;
        component = TestUtils.renderIntoDocument(<TestController/>);
      });

      it("should not call to requestState", () => {
        spyOn(TestController, 'requestState');
        expect(TestController.requestState).not.toHaveBeenCalled();
      });

      it('should use window.__initialData__ to set the initial state', () => {
        expect(component.state).toEqual(initialData);
      });

      it('should set window.__initialData__ to undefined', () => {
        expect(window.__initialData__).toBe(undefined);
      });
    });

    describe('when no window.__initialData__', () => {
      let params = {id:'id'};

      beforeEach((done) => {
        window.__initialData__ = undefined;
        spyOn(TestController, 'requestState').and.callThrough();
        component = TestUtils.renderIntoDocument(<TestController params={params}/>);
        //wait until the requestState is resolved
        TestController.requestState().then(done)
      });

      it('should request for initialState and set it on the state', () => {
        expect(component.state.initialData).toBe('data');
      });

      it("should send props.params to requestState", () => {
        expect(TestController.requestState).toHaveBeenCalledWith(params);
      });
    });
  });

  describe('when rendering on server', () => {
    let initialData = {batmanVillians:['calendarMan', 'penguin']};

    beforeEach(() => {
      window.__initialData__ = undefined;
      // window = undefined;
      component = TestUtils.renderIntoDocument(<TestController initialData={initialData}/>);
    });

    it("should use props.initialData to set state", () => {
      expect(component.state).toEqual(initialData);
    });
  });

});
