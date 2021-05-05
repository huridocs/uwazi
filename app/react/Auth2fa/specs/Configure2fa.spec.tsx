import React from 'react';
import { shallow } from 'enzyme';
import * as redux from 'redux';
import { LocalForm } from 'react-redux-form';
import { Map } from 'immutable';

import { RequestParams } from 'app/utils/RequestParams';

import Auth2faAPI from '../Auth2faAPI';
import * as actions from '../actions/actions';

import Configure2fa, { mapStateToProps, mapDispatchToProps } from '../Configure2fa';

const mockSetSecret = () => {
  spyOn(Auth2faAPI, 'setSecret').and.callFake(params => {
    if (params instanceof RequestParams) {
      return { otpauth: 'otpAuthURL', secret: 'generatedSecret' };
    }
    return fail('Wrong params sent!');
  });
};

const mockEnable = () => {
  spyOn(Auth2faAPI, 'enable').and.callFake(params => {
    // @ts-ignore params.data may be undefined
    if (params instanceof RequestParams && params.data.token === 'correctToken') {
      return { success: true };
    }

    const error = { status: 409 };
    throw error;
  });
};

describe('Configure2fa Component', () => {
  let component: any;
  let instance: any;

  const dispatch = jest.fn();

  const mockBindActionCreators = () => {
    spyOn(redux, 'bindActionCreators').and.callFake((_props, _dispatch) => {
      if (_dispatch === dispatch) {
        return _props;
      }
      return fail('Wrong dispatch sent to mapDispatchToProps!');
    });
  };

  const render = (storeUser = Map({ using2fa: false })) => {
    const mappedStateProps = mapStateToProps({ user: storeUser });
    const mappedDispatchProps = mapDispatchToProps(dispatch);
    const fullProps = { ...mappedStateProps, ...mappedDispatchProps };

    component = shallow(<Configure2fa.WrappedComponent {...fullProps} />);
    instance = component.instance();
  };

  beforeEach(() => {
    mockBindActionCreators();
    mockSetSecret();
    mockEnable();
    spyOn(actions, 'enable2fa');
    render();
  });

  describe('when user already using 2fa', () => {
    it('should show a "successfully configured" component', () => {
      render(Map({ using2fa: true }));
      expect(component).toMatchSnapshot();
    });
  });

  describe('when user not already using 2fa', () => {
    it('should show a QR code and Secret upon mounting', () => {
      expect(component).toMatchSnapshot();
    });
  });

  describe('enable2fa (form submit)', () => {
    it('should call on enable2fa uppon success', async () => {
      const { onSubmit } = component.find(LocalForm).props();
      await onSubmit({ token: 'correctToken' });
      expect(actions.enable2fa).toHaveBeenCalled();
    });

    it('should set state to "conflict" and not call on enable2fa', async () => {
      await instance.enable2fa({ token: 'wrongToken' });
      expect(actions.enable2fa).not.toHaveBeenCalled();
      expect(instance.state.conflict).toBe(true);
      expect(component).toMatchSnapshot();
    });
  });
});
