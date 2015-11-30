import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import MyAccount from '../MyAccount.js'
import {events} from '../../../utils/index'

describe('MyAccount', () => {

  let component, fetch_mock, user;

  let res = new window.Response('', {
    status: 200,
  });

  function instantiate_component(res){
    fetch_mock = jasmine.createSpy('fetch_mock').and.returnValue(Promise.resolve(res));
    user = {_id: 1234, _rev: 789, username: 'SelinaKyle'};
    component = TestUtils.renderIntoDocument(<MyAccount fetch={fetch_mock} user={user}/>);
  }

  beforeEach(() => instantiate_component(res));

  describe('submit()', () => {

    it('should request the api to change the password', (done) => {
      component.setState({password: 'cat woman', repeat_password: 'cat woman'});
      component.submit(new Event('submit'))
      .then(() => {
        var args = fetch_mock.calls.mostRecent().args;
        expect(args[0]).toBe('/api/users');
        let body = JSON.parse(args[1].body);
        expect(body.password).toBe('cat woman');
        expect(body._id).toBe(1234);
        expect(body._rev).toBe(789);
        done();
      })
    });

    describe('when it ends', () => {
      it('should display feedback with the result', (done) => {
        component.setState({password: 'cat woman', repeat_password: 'cat woman'});
        component.submit(new Event('submit'))
        .then(() => {
          expect(component.state.feedback.message).toBe('Password changed succesfully');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when passwords do not match', () => {
      it('should set error true', () => {
        component.setState({password: 'cat woman', repeat_password: 'dog woman'});
        component.submit(new Event('submit'));
        expect(component.state.feedback.message).toBe('Passwords should match');
      });
    });

  });
});
