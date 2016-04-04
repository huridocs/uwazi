import React from 'react';
import RouteHandler from 'app/controllers/App/RouteHandler';
import backend from 'fetch-mock';
// import TestUtils from 'react-addons-test-utils';
import {APIURL} from '../../../config.js';
// import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';
import {shallow} from 'enzyme';

class TestController extends RouteHandler {

  static requestState() {
    return Promise.resolve({initialData: 'data'});
  }
  setReduxState(params) {
    this.setReduxStateCalledWith = params;
  }
  render() {
    return <div></div>;
  }
}

describe('RouteHandler', () => {
  let component;
  let instance;

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: []})});
    delete window.__initialData__;

    spyOn(TestController, 'requestState').and.callThrough();

    RouteHandler.renderedFromServer = false;
    component = shallow(<TestController />);
    instance = component.instance();
    instance.constructor = TestController;
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
    it('should request for initialState and setReduxState', (done) => {
      setTimeout(() => {
        expect(TestController.requestState).toHaveBeenCalled();
        expect(instance.setReduxStateCalledWith).toEqual({initialData: 'data'});
        done();
      });
    });
  });
});
