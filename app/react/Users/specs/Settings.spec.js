import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {Settings} from '../Settings';
import SettingsNavigation from '../components/SettingsNavigation';
import AccountSettings from '../components/AccountSettings';
import CollectionSettings from '../components/CollectionSettings';
import UsersAPI from '../UsersAPI';

describe('Settings', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      settings: Immutable.fromJS({}),
      section: Immutable.fromJS('account'),
      account: Immutable.fromJS({})
    };
    component = shallow(<Settings {...props} />);
  });

  describe('render()', () => {
    it('should render the SettingsNavigation', () => {
      expect(component.find(SettingsNavigation).length).toBe(1);
    });

    it('should render the proper section', () => {
      expect(component.find(AccountSettings).length).toBe(1);
      expect(component.find(CollectionSettings).length).toBe(0);
      props.section = Immutable.fromJS('collection');
      component = shallow(<Settings {...props} />);
      expect(component.find(CollectionSettings).length).toBe(1);
      expect(component.find(AccountSettings).length).toBe(0);
    });
  });

  describe('requestState', () => {
    let user = {name: 'doe'};

    beforeEach(() => {
      spyOn(UsersAPI, 'currentUser').and.returnValue(Promise.resolve(user));
    });

    it('should get the current user', (done) => {
      Settings.requestState()
      .then((state) => {
        expect(state.user).toEqual(user);
        done();
      });
    });
  });
});
