import { shallow } from 'enzyme';
import React from 'react';
import Immutable from 'immutable';
import { headTag } from '../Root';

describe('Root component', () => {
  describe('favicon', () => {
    const dummyHelmet = {
      title: {
        toComponent: () => '',
      },
      meta: {
        toComponent: () => '',
      },
      link: {
        toComponent: () => '',
      },
    };

    it('should use the default uwazi icon if no custom icon selected', () => {
      const reduxData = {
        settings: {
          collection: Immutable.fromJS({}),
        },
      };

      const component = shallow(<html lang="en">{headTag(dummyHelmet, [], reduxData)}</html>);

      expect(component.find({ rel: 'shortcut icon' }).props().href).toBe('/public/favicon.ico');
    });

    it('should use the selection if a custom icon was selected', () => {
      const reduxData = {
        settings: {
          collection: Immutable.fromJS({
            favicon: 'custom_icon_url',
          }),
        },
      };

      const component = shallow(<html lang="en">{headTag(dummyHelmet, [], reduxData)}</html>);

      expect(component.find({ rel: 'shortcut icon' }).props().href).toBe('custom_icon_url');
    });
  });
});
