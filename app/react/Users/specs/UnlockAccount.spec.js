import React from 'react';
import { shallow } from 'enzyme';
import { browserHistory } from 'react-router';

import { UnlockAccount } from '../UnlockAccount';

describe('UnlockAccount', () => {
  let props;
  let context;

  beforeEach(() => {
    spyOn(browserHistory, 'push');
    props = {
      unlockAccount: jest.fn().mockResolvedValue(),
      params: { username: 'username', code: 'code' }
    };

    context = { router: { location: '' } };
  });

  const getComponent = () => shallow(<UnlockAccount {...props} />, { context });

  it('should call unlockAccount with params', (done) => {
    getComponent();
    setImmediate(() => {
      expect(props.unlockAccount).toHaveBeenCalledWith(props.params);
      done();
    });
  });

  it('should redirect to login on success', (done) => {
    getComponent();
    setImmediate(() => {
      expect(browserHistory.push).toHaveBeenCalledWith('/login');
      done();
    });
  });

  it('should redirect to login on failure', (done) => {
    props.resetPassword = jest.fn().mockRejectedValue('error');
    getComponent();
    setImmediate(() => {
      expect(browserHistory.push).toHaveBeenCalledWith('/login');
      done();
    });
  });
});
