/**
 * @jest-environment jsdom
 */
import Immutable from 'immutable';
import { actions as formActions } from 'react-redux-form';
import { renderConnected } from 'app/utils/test/renderConnected';
import { Login } from '../Login.js';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => {},
  useNavigate: () => {},
  useParams: () => {},
  useMatches: () => [],
}));

describe('Login', () => {
  let component;
  let props;
  let instance;
  let formDispatch;

  const render = () => {
    const storeState = {
      settings: {
        collection: Immutable.fromJS({
          private: false,
        }),
      },
    };

    component = renderConnected(Login, props, storeState);
  };

  const expectState = (state, expected) => {
    expect(state).toEqual(expect.objectContaining(expected));
  };

  beforeEach(() => {
    formDispatch = jasmine.createSpy('formDispatch');
    props = {
      login: jasmine.createSpy('login').and.callFake(async () => Promise.resolve()),
      recoverPassword: jasmine
        .createSpy('recoverPassword')
        .and.callFake(async () => Promise.resolve()),
      notify: jasmine.createSpy('notify'),
      reloadThesauris: jasmine.createSpy('reloadThesauris'),
      change: jasmine.createSpy('change'),
    };
    spyOn(formActions, 'reset').and.callFake(formName => formName);
    render();

    instance = component.dive().instance();
    component.instance().formDispatch = formDispatch;
  });

  describe('render', () => {
    it('should set state', () => {
      expect(instance.state).toEqual({
        error: false,
        error2fa: false,
        recoverPassword: false,
        tokenRequired: false,
        render: true,
      });
    });

    it('should render the component with the login form', () => {
      expect(component.dive()).toMatchSnapshot();
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

    xdescribe('when recoverPassword is true', () => {
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

    xdescribe('on response success', () => {
      xit('should reload thesauris, set filters to include "restricted", and go to home', async () => {
        spyOn(browserHistory, 'push');
        expect(props.reloadThesauris).not.toHaveBeenCalled();
        expect(props.change).not.toHaveBeenCalled();
        await instance.submit('credentials');

        expect(props.reloadThesauris).toHaveBeenCalled();
        expect(props.change).toHaveBeenCalledWith('library.search.publishedStatus.values', [
          'published',
          'restricted',
        ]);
        expect(browserHistory.push).toHaveBeenCalledWith('/');
      });

      describe('when the instance is private', () => {
        it('should call reloadHome', done => {
          props.private = true;
          render();

          delete window.location;
          window.location = { assign: jest.fn() };

          instance
            .submit('credentials')
            .then(() => {
              expect(window.location.assign).toHaveBeenCalled();
              done();
            })
            .catch(done.fail);
        });
      });
    });

    xdescribe('on response failure', () => {
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

  xdescribe('setRecoverPassword()', () => {
    it('should ser recoverPassword true, and error false', () => {
      instance.setRecoverPassword();
      expect(instance.state.error).toBe(false);
      expect(instance.state.recoverPassword).toBe(true);
    });
  });
});
