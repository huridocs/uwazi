import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import UserWidget from '../components/UserWidget.js'
import { Link } from 'react-router'
import Routes from '../Routes'

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

});
