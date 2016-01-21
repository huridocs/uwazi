import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import App from '../App.js'
import Provider from '../core/Provider.js'
import {events} from '../../../utils/index'

describe('App', () => {

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
    TestUtils.renderIntoDocument(<Provider><App ref={(ref) => component = ref} fetch={fetch_rejected}/></Provider>);
  })

  describe('on instance', () => {
    it('should subscribe to login event with fetchUser', () => {
      expect(events.on).toHaveBeenCalledWith('login', component.fetchUser);
    });
  });

  describe('when fething user', () => {
    beforeEach(() => {
      TestUtils.renderIntoDocument(<Provider><App ref={(ref) => component = ref} fetch={fetch_mock}/></Provider>);
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
