import React from 'react';
import {shallow} from 'enzyme';

import {CollectionSettings} from '../CollectionSettings';
import SettingsAPI from '../../SettingsAPI';

describe('CollectionSettings', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      settings: {_id: 'id', links: ['123']},
      notify: jasmine.createSpy('notify')
    };
    component = shallow(<CollectionSettings {...props} />);
  });

  describe('updateSettings', () => {
    beforeEach(() => {
      spyOn(SettingsAPI, 'save').and.returnValue(Promise.resolve());
    });

    it('should save the settings with defaults', () => {
      component.find('form').simulate('submit', {preventDefault: () => {}});
      expect(SettingsAPI.save)
      .toHaveBeenCalledWith(Object.assign({home_page: '', site_name: '', mailerConfig: '', analyticsTrackingId: '', private: false}, props.settings));
    });

    it('should save the updated settings', () => {
      props.settings = {
        _id: 'id',
        _rev: 'rev',
        site_name: 'Uwazi',
        home_page: '123',
        mailerConfig: 'some config',
        links: ['123'],
        analyticsTrackingId: 'X-123-Y',
        private: 'X-123-Y'
      };
      component = shallow(<CollectionSettings {...props} />);
      component.find('form').simulate('submit', {preventDefault: () => {}});
      expect(SettingsAPI.save).toHaveBeenCalledWith(props.settings);
    });
  });
});
