/** @format */

import React from 'react';
import { shallow } from 'enzyme';
import { browserHistory } from 'react-router';
import { actions as formActions } from 'react-redux-form';

import { Login } from '../Login.js';

describe('Login', () => {
  let component;
  let instance;
  let props;
  let formDispatch;

  const render = () => {
    const context = { store: { getState: () => ({}) } };
    component = shallow(<Login {...props} />, { context });
    instance = component.instance();
    instance.attachDispatch(formDispatch);
  };

  beforeEach(() => {
    formDispatch = jasmine.createSpy('formDispatch');
    props = {
      login: jasmine.createSpy('login').and.returnValue(Promise.resolve()),
      recoverPassword: jasmine.createSpy('recoverPassword').and.returnValue(Promise.resolve()),
      notify: jasmine.createSpy('notify'),
      reloadThesauris: jasmine.createSpy('reloadThesauris'),
    };
    spyOn(formActions, 'reset').and.callFake(formName => formName);
    render();
  });

  describe('on instance', () => {
    it('should set state', () => {
      expect(instance.state).toEqual({
        error: false,
        error2fa: false,
        recoverPassword: false,
        tokenRequired: false,
      });
    });
  });

  describe('submit()', () => {
    it('should send the credentials', done => {
      instance
        .submit('credentials')
        .then(() => {
          expect(props.login).toHaveBeenCalledWith('credentials');
          done();
        })
        .catch(done.fail);
    });

    describe('when recoverPassword is true', () => {
      it('should call recoverPassword with the email', done => {
        instance.state.recoverPassword = true;
        instance
          .submit({ username: 'email@recover.com' })
          .then(() => {
            expect(props.recoverPassword).toHaveBeenCalledWith('email@recover.com');
            expect(formDispatch).toHaveBeenCalledWith('loginForm');
            done();
          })
          .catch(done.fail);
      });
    });

    describe('on response success', () => {
      it('should reload thesauris and go to home', done => {
        spyOn(browserHistory, 'push');
        expect(props.reloadThesauris).not.toHaveBeenCalled();
        instance
          .submit('credentials')
          .then(() => {
            expect(props.reloadThesauris).toHaveBeenCalled();
            expect(browserHistory.push).toHaveBeenCalledWith('/');
            done();
          })
          .catch(done.fail);
      });

      describe('when the instance is private', () => {
        it('should call reloadHome', done => {
          props.private = true;
          render();

          spyOn(browserHistory, 'push');
          spyOn(window.location, 'reload');

          instance
            .submit('credentials')
            .then(() => {
              expect(browserHistory.push).toHaveBeenCalledWith('/');
              expect(window.location.reload).toHaveBeenCalled();
              done();
            })
            .catch(done.fail);
        });
      });
    });

    describe('on response failure', () => {
      it('should set error true', done => {
        props.login = jasmine
          .createSpy('login')
          .and.returnValue(Promise.reject(new Error({ status: 123 })));
        render();

        instance
          .submit(new Event('submit'))
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
