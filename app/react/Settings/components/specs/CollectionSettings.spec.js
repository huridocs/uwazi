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
      settings: {
        _id: 'id',
        dateFormat: 'DD-MM-YYYY',
        allowedPublicTemplates: ['existingId1', 'existingId2'],
      },
      notify: jasmine.createSpy('notify'),
      setSettings: jasmine.createSpy('setSettings'),
    };
    component = shallow(<CollectionSettings {...props} />);
  });

  describe('constructor', () => {
    it('should assign the initial state correctly', () => {
      expect(component.state().dateSeparator).toBe('-');
      expect(component.state().dateFormat).toBe(1);
      expect(component.state().customLandingpage).toBe(false);
      expect(component.state().allowedPublicTemplatesString).toBe('existingId1,existingId2');
    });

    it('should not fail on missing values', () => {
      delete props.settings.allowedPublicTemplates;
      component = shallow(<CollectionSettings {...props} />);
      expect(component.state().allowedPublicTemplatesString).toBe('');
    });
  });

  describe('updateSettings', () => {
    let values;
    let expectedData;

    beforeEach(() => {
      spyOn(SettingsAPI, 'save').and.returnValue(Promise.resolve());
      values = {
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
        private: false,
        allowedPublicTemplatesString: 'id1,id2',
      };

      expectedData = {
        _id: 'id',
        _rev: 'rev',
        analyticsTrackingId: 'X-123-Y',
        dateFormat: 'MM/DD/YYYY',
        home_page: '',
        mailerConfig: 'config',
        matomoConfig: 'matomo',
        private: false,
        site_name: 'Uwazi',
        allowedPublicTemplates: ['id1', 'id2'],
      };

      component = shallow(<CollectionSettings {...props} />);
      component.find(LocalForm).simulate('submit', values);
    });

    it('should sanitize the form data', () => {
      expect(SettingsAPI.save).toHaveBeenCalledWith(new RequestParams(expectedData));
    });

    it('should parse empty allowedPublicTemplates values as empty array', () => {
      values.allowedPublicTemplatesString = '';
      expectedData.allowedPublicTemplates = [];

      component = shallow(<CollectionSettings {...props} />);
      component.find(LocalForm).simulate('submit', values);

      expect(SettingsAPI.save).toHaveBeenCalledWith(new RequestParams(expectedData));
    });
  });
});
