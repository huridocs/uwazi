import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import MyAccount from '../MyAccount.js'
import {events} from '../../../utils/index'

describe('MyAccount', () => {

  let component, fetch_mock;

  let res = new window.Response('', {
    status: 200,
  });

  function instantiate_component(res){
    fetch_mock = jasmine.createSpy('fetch_mock').and.returnValue(Promise.resolve(res));
    component = TestUtils.renderIntoDocument(<MyAccount fetch={fetch_mock}/>);
  }

  beforeEach(() => instantiate_component(res));

  describe('submit()', () => {

    describe('when passwords match', () => {
      // it('should request the api to change the password', (done) => {
      //   component.setState({password: 'cat woman', repeat_password: 'cat woman'});
      //
      //   var promise = component.submit(new Event('submit'))
      //   .then(() => {
      //     var args = fetch_mock.calls.mostRecent().args;
      //     expect(args[0]).toBe('/api/login');
      //     expect(args[1].body).toBe(JSON.stringify(component.state.credentials));
      //     done();
      //   })
      //   .catch(done.fail);
      //
      // });
    });

    describe('when passwords do not match', () => {
      it('should set error true', () => {
        expect(component.state.error).toBe(false);
        component.setState({password: 'cat woman', repeat_password: 'dog woman'});
        component.submit();
        expect(component.state.error).toBe(true);
      });
    });

  });
});
