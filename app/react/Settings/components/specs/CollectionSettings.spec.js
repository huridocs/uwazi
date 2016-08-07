import React from 'react';
import {shallow} from 'enzyme';

import {CollectionSettings} from '../CollectionSettings';
import SettingsAPI from '../../SettingsAPI';

describe('CollectionSettings', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      settings: {site_name: 'Uwazi'},
      notify: jasmine.createSpy('notify')
    };
    component = shallow(<CollectionSettings {...props} />);
  });

  describe('update name', () => {
    beforeEach(() => {
      spyOn(SettingsAPI, 'save').and.returnValue(Promise.resolve());
    });

    it('should save the settings object', () => {
      component.find('form').simulate('submit', {preventDefault: () => {}});
      expect(SettingsAPI.save).toHaveBeenCalledWith({site_name: 'Uwazi'});
    });
  });
});
