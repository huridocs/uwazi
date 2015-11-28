import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import UserWidget from '../components/UserWidget.js'
import {events} from '../utils/index'

describe('UserWidget', () => {

  let component;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<UserWidget/>);
  })

  it('should render the login link', () => {
    let loginLink = TestUtils.findRenderedDOMComponentWithTag(component, 'a');
    expect(loginLink.textContent).toEqual('Login');
  });

  describe('When the user is loged in', () => {
    beforeEach(() => {
      let user =  {username: 'Jocker'};
      component = TestUtils.renderIntoDocument(<UserWidget user={user}/>);
    })

    it('should render the lout link', () => {
      let links = TestUtils.scryRenderedDOMComponentsWithTag(component, 'a');
      expect(links[1].textContent).toEqual('Logout');
    });

    it('should render the username', () => {
      expect(ReactDOM.findDOMNode(component).textContent).toMatch('Jocker');
    });
  })
});
