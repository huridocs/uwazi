import React from 'react';
import {shallow} from 'enzyme';

import {CollectionSettings} from '../CollectionSettings';
import SettingsAPI from '../../SettingsAPI';

describe('CollectionSettings', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      settings: {_id: 'id', _rev: 'rev', site_name: 'Uwazi', home_page: '123', links: []},
      notify: jasmine.createSpy('notify')
    };
    component = shallow(<CollectionSettings {...props} />);
  });

  describe('updateSettings', () => {
    beforeEach(() => {
      spyOn(SettingsAPI, 'save').and.returnValue(Promise.resolve());
    });

    it('should save only the site_name and home page', () => {
      const {_id, _rev, site_name, home_page} = props.settings;
      component.find('form').simulate('submit', {preventDefault: () => {}});
      expect(SettingsAPI.save).toHaveBeenCalledWith({_id, _rev, site_name, home_page});
    });
  });
});
