import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import UserWidget from '../components/UserWidget.js'
import fetch from 'isomorphic-fetch'
import {events} from '../utils/index'

describe('Component', () => {

  let component;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<UserWidget />);
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
      var res = new window.Response('{"username":"Iron Man"}', {
          status: 200,
          headers: {
            'Content-type': 'application/json'
        }
      });

      //window.fetch !== fetch :(   http://rjzaworski.com/2015/06/testing-api-requests-from-window-fetch
      //sinon explota al cargarlo con webpack
      //mock-fetch no lo he logrado hacer uncionar
      spyOn(window, 'fetch').and.returnValue(Promise.resolve(res));

    })

    fit('should request the user and render its name', () => {
      expect(ReactDOM.findDOMNode(component).textContent).toMatch('Iron Man');
    })
  });

});
