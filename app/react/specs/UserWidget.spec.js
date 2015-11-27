import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import UserWidget from '../components/UserWidget.js'
import {events} from '../utils/index'

describe('UserWidget', () => {

  let component;

  let fetch_mock = function(){
      let res = new window.Response('{"username":"Scarecrow"}', {
          status: 200,
          headers: {
            'Content-type': 'application/json'
        }
      });

      let promise_mock = Promise.resolve(res);
      return promise_mock;
  };

  let fetch_rejected = () => {return Promise.reject()};

  beforeEach(() => {
    spyOn(events, 'on');
    component = TestUtils.renderIntoDocument(<UserWidget fetch={fetch_rejected}/>);
  })

  describe('on instance', () => {
    it('should subscribe to login event with fetchUser', () => {
      expect(events.on).toHaveBeenCalledWith('login', component.fetchUser);
    });
  });

  it('should render the login link', () => {
    let loginLink = TestUtils.findRenderedDOMComponentWithTag(component, 'a');
    expect(loginLink.textContent).toEqual('Login');
  });

  describe('When the user is loged in', () => {
    beforeEach(() => {
      component.setState({username: 'Jocker'});
    })

    it('should render the lout link', () => {
      let loginLink = TestUtils.findRenderedDOMComponentWithTag(component, 'a');
      expect(loginLink.textContent).toEqual('Logout');
    });

    it('should render the username', () => {
      expect(ReactDOM.findDOMNode(component).textContent).toMatch('Jocker');
    });
  })

  describe('when fething user', () => {
    beforeEach(() => {
      component = TestUtils.renderIntoDocument(<UserWidget fetch={fetch_mock}/>);
    })

    it('should set the username on the state and render it', (done) => {
      component.fetchUser()
      .then(() => {
        expect(ReactDOM.findDOMNode(component).textContent).toMatch('Scarecrow');
        done();
      });
    })
  });

});
