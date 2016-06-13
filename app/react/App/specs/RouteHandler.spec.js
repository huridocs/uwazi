import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import backend from 'fetch-mock';
import {APIURL} from '../../config.js';
import 'jasmine-immutablejs-matchers';
import {shallow} from 'enzyme';

class TestController extends RouteHandler {

  static requestState(params) {
    return Promise.resolve({initialData: params.id});
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
  let routeParams = {id: '123'};

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: []})});
    delete window.__initialData__;

    spyOn(TestController, 'requestState').and.callThrough();

    RouteHandler.renderedFromServer = false;
    component = shallow(<TestController params={routeParams} />);
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
        expect(instance.setReduxStateCalledWith).toEqual({initialData: '123'});
        done();
      });
    });
  });

  describe('componentWillReceiveProps', () => {
    describe('when params change', () => {
      it('should request the clientState', () => {
        spyOn(instance, 'getClientState');
        instance.componentWillReceiveProps({params: {id: '456'}});
        expect(instance.getClientState).toHaveBeenCalled();
      });

      it('should call emptyState', () => {
        spyOn(instance, 'emptyState');
        instance.componentWillReceiveProps({params: {id: '456'}});
        expect(instance.emptyState).toHaveBeenCalled();
      });
    });

    describe('when params are the same', () => {
      it('should NOT request the clientState', () => {
        spyOn(instance, 'getClientState');
        instance.componentWillReceiveProps({params: routeParams});
        expect(instance.getClientState).not.toHaveBeenCalled();
      });
    });
  });
});
