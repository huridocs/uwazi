import React from 'react';
import TestUtils from 'react-addons-test-utils';

import App from '../App.js';
import Layout from '../Layout.js';
import Provider from '../Provider.js';
import {events} from '../../../utils/index';

describe('App', () => {
  let component;
  let layout;

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
    TestUtils.renderIntoDocument(<Provider><App ref={(ref) => {
      component = ref;
    }} fetch={fetchRejected}/></Provider>);
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
      TestUtils.renderIntoDocument(<Provider><App ref={(ref) => {
        component = ref;
      }} fetch={fetchMock}><Layout ref={(ref) => {
        layout = ref;
      }}/></App></Provider>);
    });

    it('should pass it to its children as property', (done) => {
      component.fetchUser()
      .then(() => {
        expect(layout.props.user).toEqual({username: 'Scarecrow'});
        done();
      });
    });
  });
});
