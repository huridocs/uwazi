import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import UsersAPI from 'app/Users/UsersAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { AccountSettings, mapStateToProps } from '../AccountSettings';

describe('AccountSettings', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<AccountSettings {...props} />);
  };

  beforeEach(() => {
    props = {
      user: { name: 'doe', using2fa: false },
      notify: jasmine.createSpy('notify'),
      setUser: jasmine.createSpy('setUser'),
    };
    spyOn(UsersAPI, 'save').and.callFake(async () => Promise.resolve({ rev: 'rev' }));
    render();
  });

  describe('change email', () => {
    it('should save the user with the new email and update the user.rev', () => {
      render();
      const input = component.find('input').find({ type: 'email' }).at(0);
      input.simulate('change', { target: { value: 'newemail@uwazi.com' } });
      component
        .childAt(0)
        .find('form')
        .at(0)
        .simulate('submit', { preventDefault: () => {} });
      expect(UsersAPI.save).toHaveBeenCalledWith(
        new RequestParams({ name: 'doe', email: 'newemail@uwazi.com', using2fa: false })
      );
    });
  });

  describe('change password', () => {
    it('should save the user with the new password', () => {
      component.setState({ password: 'ultraSecret', repeatPassword: 'ultraSecret' });
      component
        .find('form')
        .at(1)
        .simulate('submit', { preventDefault: () => {} });
      expect(UsersAPI.save).toHaveBeenCalledWith(
        new RequestParams({ name: 'doe', password: 'ultraSecret', using2fa: false })
      );
    });

    it('should empty the passwords values', () => {
      component.setState({ password: 'ultraSecret', repeatPassword: 'ultraSecret' });
      component
        .find('form')
        .at(1)
        .simulate('submit', { preventDefault: () => {} });
      expect(component.instance().state.password).toBe('');
      expect(component.instance().state.repeatPassword).toBe('');
    });

    describe('when passwords do not match', () => {
      it('should not update it', () => {
        component.setState({ password: 'ultraSecret', repeatPassword: 'IDontKnowWhatIAmDoing' });
        component
          .find('form')
          .at(1)
          .simulate('submit', { preventDefault: () => {} });
        expect(UsersAPI.save).not.toHaveBeenCalled();
      });

      it('should display an error', () => {
        component.setState({ password: 'ultraSecret', repeatPassword: 'IDontKnowWhatIAmDoing' });
        component
          .find('form')
          .at(1)
          .simulate('submit', { preventDefault: () => {} });
        expect(component.find('form').at(1).childAt(0).hasClass('has-error')).toBe(true);
        expect(component.find('form').at(1).childAt(1).hasClass('has-error')).toBe(true);
      });
    });
  });

  describe('2fa', () => {
    it('should render a warning and link to protect account if user not using 2fa', () => {
      expect(component).toMatchSnapshot();
    });

    it('should render a success area if user has already activated 2fa', () => {
      props.user.using2fa = true;
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('mapStateToProps', () => {
    let state;

    beforeEach(() => {
      state = {
        user: Immutable.fromJS({ email: 'oldemail@uwazi.com', name: 'doe', using2fa: false }),
      };
    });

    it('should map the logged user data', () => {
      expect(mapStateToProps(state).user.email).toBe('oldemail@uwazi.com');
      expect(mapStateToProps(state).user.name).toBe('doe');
      expect(mapStateToProps(state).user.using2fa).toBe(false);
    });
  });
});
