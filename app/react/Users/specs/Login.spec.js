import React from 'react';
import {shallow} from 'enzyme';
import {browserHistory} from 'react-router';

import {Login} from '../Login.js';

describe('Login', () => {
  let component;
  let instance;
  let props;

  let render = () => {
    component = shallow(<Login {...props}/>);
    instance = component.instance();
  };

  beforeEach(() => {
    props = {
      login: jasmine.createSpy('login').and.returnValue(Promise.resolve()),
      recoverPassword: jasmine.createSpy('recoverPassword').and.returnValue(Promise.resolve()),
      notify: jasmine.createSpy('notify'),
      reset: jasmine.createSpy('reset')
    };
    render();
  });

  describe('on instance', () => {
    it('should set state', () => {
      expect(instance.state).toEqual({error: false, recoverPassword: false});
    });
  });

  describe('submit()', () => {
    it('should send the credentials', (done) => {
      instance.submit('credentials')
      .then(() => {
        expect(props.login).toHaveBeenCalledWith('credentials');
        done();
      })
      .catch(done.fail);
    });

    describe('when recoverPassword is true', () => {
      it('should call recoverPassword with the email', (done) => {
        instance.state.recoverPassword = true;
        instance.submit({username: 'email@recover.com'})
        .then(() => {
          expect(props.recoverPassword).toHaveBeenCalledWith('email@recover.com');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('on response success', () => {
      it('should go to home', (done) => {
        spyOn(browserHistory, 'push');
        instance.submit('credentials')
        .then(() => {
          expect(browserHistory.push).toHaveBeenCalledWith('/');
          done();
        })
        .catch(done.fail);
      });

      describe('when the instance is private', () => {
        it('should call reloadHome', (done) => {
          props.private = true;
          render();

          spyOn(browserHistory, 'push');
          spyOn(instance, 'reloadHome');

          instance.submit('credentials')
          .then(() => {
            expect(browserHistory.push).toHaveBeenCalledWith('/');
            expect(instance.reloadHome).toHaveBeenCalled();
            done();
          })
          .catch(done.fail);
        });
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

  describe('setRecoverPassword()', () => {
    it('should ser recoverPassword true, and error false', () => {
      instance.setRecoverPassword();
      expect(instance.state.error).toBe(false);
      expect(instance.state.recoverPassword).toBe(true);
    });
  });
});
