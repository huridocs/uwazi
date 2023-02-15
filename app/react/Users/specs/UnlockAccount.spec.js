/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import { UnlockAccount } from '../UnlockAccount';

describe('UnlockAccount', () => {
  let props;
  let context;

  beforeEach(() => {
    props = {
      unlockAccount: jest.fn().mockResolvedValue(),
      params: { username: 'username', code: 'code' },
      navigate: jest.fn(),
    };

    context = { store: { getState: () => ({}) } };
  });

  const renderComponent = () => shallow(<UnlockAccount {...props} />, { context });

  it('should call unlockAccount with params', done => {
    renderComponent();
    setTimeout(() => {
      expect(props.unlockAccount).toHaveBeenCalledWith(props.params);
      expect(props.navigate).toHaveBeenCalledWith('/login');
      done();
    }, 0);
  });

  it('should redirect to login on success', done => {
    renderComponent();
    setTimeout(() => {
      expect(props.navigate).toHaveBeenCalledWith('/login');
      done();
    }, 0);
  });

  it('should redirect to login on failure', done => {
    props.resetPassword = jest.fn().mockRejectedValue('error');
    renderComponent();
    setTimeout(() => {
      expect(props.navigate).toHaveBeenCalledWith('/login');
      done();
    }, 0);
  });
});
