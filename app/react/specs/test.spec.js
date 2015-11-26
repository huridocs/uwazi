import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import UserWidget from '../components/UserWidget.js'
//import fetch from 'isomorphic-fetch'
import {events} from '../utils/index'

describe('Component', () => {

  let component;
  let fetch_mock = function(){
    console.log('FETCH MOCKED !');
      let res = new window.Response('{"username":"Iron Man"}', {
          status: 200,
          headers: {
            'Content-type': 'application/json'
        }
      });

      let promise_mock = Promise.resolve(res);
      console.log(promise_mock);
      return promise_mock;
  };

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<UserWidget fetch={fetch_mock}/>);
  })

  it('should render the login link', () => {
    let loginLink = TestUtils.findRenderedDOMComponentWithTag(component, 'a');
    expect(loginLink.textContent).toEqual('Login');
  });

  describe('When the user is loged in', () => {
    beforeEach(() => {
      component.setState({username: 'Thor'});
    })

    it('should render the lout link', () => {
      let loginLink = TestUtils.findRenderedDOMComponentWithTag(component, 'a');
      expect(loginLink.textContent).toEqual('Logout');
    });

    it('should render the username', () => {
      expect(ReactDOM.findDOMNode(component).textContent).toMatch('Thor');
    });
  })

  describe('when a login event is triggered', () => {
    beforeEach(() => {
      events.emit('login');
    })

    fit('should request the user and render its name', () => {
      expect(ReactDOM.findDOMNode(component).textContent).toMatch('Iron Man');
    })
  });

});
