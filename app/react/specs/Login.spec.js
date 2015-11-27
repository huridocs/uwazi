import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import Login from '../components/Login.js'
import {events} from '../utils/index'

describe('Login', () => {

  let component, fetch_mock;

  let res = new window.Response('', {
    status: 200,
  });

  function instantiate_component(res){
    fetch_mock = jasmine.createSpy('fetch_mock').and.returnValue(Promise.resolve(res));
    component = TestUtils.renderIntoDocument(<Login fetch={fetch_mock}/>);
  }

  beforeEach(() => instantiate_component(res));

  describe('on instance', () => {
    it('should set state with blank username and password', () => {
      expect(component.state.credentials).toEqual({username:'', password:''});
    });

    it('should set state with error false', () => {
      expect(component.state.error).toEqual(false);
    });
  });

  describe('render', () => {

    describe('when there is NOT an error', () => {
      it('should NOT display an error message', () => {
        expect(ReactDOM.findDOMNode(component).textContent).not.toMatch('Invalid password or username');
      });
    });

    describe('when there is an error', () => {
      it('should display an error message', () => {
        component.setState({error: true});
        expect(ReactDOM.findDOMNode(component).textContent).toMatch('Invalid password or username');
      });
    });
  });

  describe('submit()', () => {
    it('should POST to /api/login with username and password', (done) => {
      component.setState({credentials:{username:'bruce wayne', password:'im batman!'}})

      var promise = component.submit(new Event('submit'))
      .then(() => {
        var args = fetch_mock.calls.mostRecent().args;
        expect(args[0]).toBe('/api/login');
        expect(args[1].body).toBe(JSON.stringify(component.state.credentials));
        done();
      })
      .catch(done.fail);

    });

    describe('on response success', () => {
      it('should set error false', (done) => {
        var promise = component.submit(new Event('submit'))
        .then(() => {
          var args = fetch_mock.calls.mostRecent().args;
          expect(component.state.error).toBe(false);
          done();
        })
        .catch(done.fail);
      });

      it('should emit login event on success', (done) => {
        let event_emitted = false;
        events.on('login', () => {event_emitted = true})

        var promise = component.submit(new Event('submit'))
        .then(() => {
          expect(event_emitted).toBe(true);
          done();
        })
        .catch(done.fail);
      });
    });

    describe('on response failure', () => {

      let res = new window.Response('', {
        status: 401,
      });

      beforeEach(() => instantiate_component(res));

      it('should set error true', (done) => {
        var promise = component.submit(new Event('submit'))
        .then(() => {
          var args = fetch_mock.calls.mostRecent().args;
          expect(component.state.error).toBe(true);
          done();
        })
        .catch(done.fail);
      });
    });


  });

});
