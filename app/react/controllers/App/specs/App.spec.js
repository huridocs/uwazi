import React from 'react';
import TestUtils from 'react-addons-test-utils';

import App from '../App.js';
import MockProvider from './MockProvider.js';
import {events} from '../../../utils/index';
import TestController from './TestController';

describe('App', () => {
  let component;
  let controller;

  let fetchMock = () => {
    let res = new window.Response('{"username":"Scarecrow"}', {
      status: 200,
      headers: {
        'Content-type': 'application/json'
      }
    });

    let promiseMock = Promise.resolve(res);
    return promiseMock;
  };

  let fetchRejected = () => {
    return Promise.reject();
  };

  beforeEach(() => {
    TestUtils.renderIntoDocument(<MockProvider>
      <App ref={(ref) => {
        component = ref;
      }} fetch={fetchRejected}/>
    </MockProvider>);
  });

  describe('on instance', () => {
    it('should subscribe to login event with fetchUser', () => {
      spyOn(component, 'fetchUser');
      events.emit('login');
      expect(component.fetchUser).toHaveBeenCalled();
    });
  });

  describe('when fething user', () => {
    beforeEach(() => {
      TestUtils.renderIntoDocument(<MockProvider><App ref={(ref) => {
        component = ref;
      }} fetch={fetchMock}>
      <TestController ref={(ref) => {
        controller = ref;
      }}/></App></MockProvider>);
    });

    it('should pass it to its children as property', (done) => {
      component.fetchUser()
      .then(() => {
        expect(controller.props.user).toEqual({username: 'Scarecrow'});
        done();
      });
    });
  });
});
