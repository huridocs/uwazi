import React from 'react';
import { RequestParams } from 'app/utils/RequestParams';

import { shallow } from 'enzyme';

import { LocalForm } from 'react-redux-form';
import { CollectionSettings } from '../CollectionSettings';
import SettingsAPI from '../../SettingsAPI';

describe('CollectionSettings', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      settings: { _id: 'id' },
      notify: jasmine.createSpy('notify'),
      setSettings: jasmine.createSpy('setSettings')
    };
    component = shallow(<CollectionSettings {...props} />);
  });

  describe('updateSettings', () => {
    beforeEach(() => {
      spyOn(SettingsAPI, 'save').and.returnValue(Promise.resolve());
    });

    it('should sanitize the form data', () => {
      const values = {
        _id: 'id',
        _rev: 'rev',
        site_name: 'Uwazi',
        home_page: 'I should be removed',
        mailerConfig: 'config',
        analyticsTrackingId: 'X-123-Y',
        dateFormat: 2,
        dateSeparator: '/',
        customLandingpage: false,
        matomoConfig: 'matomo',
        private: false
      };
      component = shallow(<CollectionSettings {...props} />);
      component.find(LocalForm).simulate('submit', values);
      const expectedData = {
        _id: 'id',
        _rev: 'rev',
        analyticsTrackingId: 'X-123-Y',
        dateFormat: 'MM/DD/YYYY',
        home_page: '',
        mailerConfig: 'config',
        matomoConfig: 'matomo',
        private: false,
        site_name: 'Uwazi'
      };
      expect(SettingsAPI.save).toHaveBeenCalledWith(new RequestParams(expectedData));
    });
  });
});
