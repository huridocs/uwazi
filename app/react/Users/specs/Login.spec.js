/**
 * @format
 * @jest-environment jsdom
 */

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

  const expectState = (state, expected) => {
    expect(state).toEqual(expect.objectContaining(expected));
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

    it('should render the component with the login form', () => {
      expect(component).toMatchSnapshot();
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
      it('should call recoverPassword with the email', async () => {
        instance.state.recoverPassword = true;
        await instance.submit({ username: 'email@recover.com' });
        expect(props.recoverPassword).toHaveBeenCalledWith('email@recover.com');
        expect(formDispatch).toHaveBeenCalledWith('loginForm');
        expectState(instance.state, {
          error: false,
          error2fa: false,
          recoverPassword: false,
          tokenRequired: false,
        });
      });
    });

    describe('on response success', () => {
      it('should reload thesauris and go to home', async () => {
        spyOn(browserHistory, 'push');
        expect(props.reloadThesauris).not.toHaveBeenCalled();
        await instance.submit('credentials');

        expect(props.reloadThesauris).toHaveBeenCalled();
        expect(browserHistory.push).toHaveBeenCalledWith('/');
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
      const prepareLoginResponse = response => {
        props.login = jasmine.createSpy('login').and.returnValue(response);
        render();
      };

      const response409 = () => {
        const error = new Error('Conflict');
        error.status = 409;
        return error;
      };

      describe('when authorization conflict (2fa required)', () => {
        it('should not set error and flag "tokenRequired"', async () => {
          prepareLoginResponse(Promise.reject(response409()));
          await instance.submit(new Event('submit'));
          expectState(instance.state, { error: false, tokenRequired: true });
          expect(component).toMatchSnapshot();
        });
      });

      describe('when authorization failure', () => {
        beforeEach(() => {
          prepareLoginResponse(Promise.reject(new Error({ status: 401 })));
        });

        it('should set error upon login failure', async () => {
          await instance.submit(new Event('submit'));
          expectState(instance.state, { error: true, tokenRequired: false, error2fa: false });
        });

        it('should set error2fa on token failure, and reset loginForm.token value', async () => {
          instance.state.tokenRequired = true;
          await instance.submit(new Event('submit'));
          expectState(instance.state, { error: true, tokenRequired: true, error2fa: true });
          expect(instance.formDispatch).toHaveBeenCalledWith(
            expect.objectContaining({ model: 'loginForm.token', value: undefined })
          );
          expect(component).toMatchSnapshot();
        });
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
