import React from 'react';
import {shallow} from 'enzyme';

import App from '../App.js';
import {events} from '../../../utils/index';
import TestController from './TestController';

describe('App', () => {
  let component;
  let instance;

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
    component = shallow(<App fetch={fetchRejected} />, {context: {getUser: () => {}}});
    instance = component.instance();
  });

  describe('on instance', () => {
    it('should subscribe to login event with fetchUser', () => {
      spyOn(instance, 'fetchUser');
      events.emit('login');
      expect(instance.fetchUser).toHaveBeenCalled();
    });
  });

  describe('when fething user', () => {
    beforeEach(() => {
      component = shallow(<App fetch={fetchMock}><TestController/></App>, {context: {getUser: () => {}}});
      instance = component.instance();
    });

    it('should pass it to its children as property', (done) => {
      instance.fetchUser()
      .then(() => {
        component.update();
        expect(component.find(TestController).props()).toEqual({user: {username: 'Scarecrow'}});
        done();
      })
      .catch(done.fail);
    });
  });
});
