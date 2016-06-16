import React from 'react';
import {shallow} from 'enzyme';
import {browserHistory} from 'react-router';

import {Login} from '../Login.js';
import Alert from 'app/components/Elements/Alert.js';

describe('Login', () => {
  let component;
  let instance;
  let props;

  let render = () => {
    component = shallow(<Login {...props}/>);
    instance = component.instance();
  };

  beforeEach(() => {
    props = {login: jasmine.createSpy('login').and.returnValue(Promise.resolve())};
    render();
  });

  describe('on instance', () => {
    it('should set state with blank username and password', () => {
      expect(instance.state.credentials).toEqual({username: '', password: ''});
    });

    it('should set state with error false', () => {
      expect(instance.state.error).toEqual(false);
    });
  });

  describe('render', () => {
    describe('when there is NOT an error', () => {
      it('should NOT display an error message', () => {
        expect(component.find(Alert).length).toBe(0);
      });
    });

    describe('when there is an error', () => {
      it('should display an error message', () => {
        component.setState({error: true});
        expect(component.find(Alert).length).toBe(1);
      });
    });
  });

  describe('submit()', () => {
    describe('on response success', () => {
      it('should set error false', (done) => {
        instance.state.error = true;

        instance.submit()
        .then(() => {
          expect(instance.state.error).toBe(false);
          done();
        })
        .catch(done.fail);
      });

      it('should go to home', (done) => {
        spyOn(browserHistory, 'push');
        instance.submit(new Event('submit'))
        .then(() => {
          expect(browserHistory.push).toHaveBeenCalledWith('/');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('on response failure', () => {
      it('should set error true', (done) => {
        props.login = jasmine.createSpy('login').and.returnValue(Promise.reject());
        render();

        instance.submit(new Event('submit'))
        .then(() => {
          expect(instance.state.error).toBe(true);
          done();
        })
        .catch(done.fail);
      });
    });
  });
});
