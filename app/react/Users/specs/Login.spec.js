import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import {browserHistory} from 'react-router';
import Login from '../Login.js';
import {events} from 'app/utils';
import backend from 'fetch-mock';
import MockProvider from '../../App/specs/MockProvider';

describe('Login', () => {
  let component;

  beforeEach(() => {
    TestUtils.renderIntoDocument(<MockProvider><Login ref={(ref) => component = ref} /></MockProvider>);

    backend.restore();
    backend.mock('http://localhost:3000/api/login', JSON.stringify({}));
  });

  describe('on instance', () => {
    it('should set state with blank username and password', () => {
      expect(component.state.credentials).toEqual({username: '', password: ''});
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
      component.setState({credentials: {username: 'bruce wayne', password: 'im batman!'}});

      component.submit(new Event('submit'))
      .then(() => {
        expect(backend.calls().matched[0][1].body).toBe(JSON.stringify(component.state.credentials));
        done();
      })
      .catch(done.fail);
    });

    describe('on response success', () => {
      it('should set error false', (done) => {
        component.state.error = true;

        component.submit(new Event('submit'))
        .then(() => {
          expect(component.state.error).toBe(false);
          done();
        })
        .catch(done.fail);
      });

      it('should emit login event on success', (done) => {
        let eventEmitted = false;
        events.on('login', () => {
          eventEmitted = true;
        });

        component.submit(new Event('submit'))
        .then(() => {
          expect(eventEmitted).toBe(true);
          done();
        })
        .catch(done.fail);
      });

      it('should go to home', (done) => {
        spyOn(browserHistory, 'push');
        component.submit(new Event('submit'))
        .then(() => {
          expect(browserHistory.push).toHaveBeenCalledWith('/');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('on response failure', () => {
      it('should set error true', (done) => {
        backend.reMock('http://localhost:3000/api/login', {body: JSON.stringify({}), status: 401});

        component.submit(new Event('submit'))
        .then(() => {
          expect(component.state.error).toBe(true);
          done();
        })
        .catch(done.fail);
      });
    });
  });
});
