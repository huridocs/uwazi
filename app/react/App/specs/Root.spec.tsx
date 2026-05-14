import { shallow } from 'enzyme';
import React from 'react';
import Immutable from 'immutable';
import { PAGE_STYLE_ELEMENT_ID } from '#app/Pages/components/PageStyle.js';
import { headTag } from '../Root.js';

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

      const component = shallow(<html lang="en">{headTag(dummyHelmet, [], reduxData, undefined)}</html>);

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

      const component = shallow(<html lang="en">{headTag(dummyHelmet, [], reduxData, undefined)}</html>);

      expect(component.find({ rel: 'shortcut icon' }).props().href).toBe('custom_icon_url');
    });
  });

  describe('page custom CSS (SSR)', () => {
    const dummyHelmet = {
      title: { toComponent: () => '' },
      meta: { toComponent: () => '' },
      link: { toComponent: () => '' },
    };

    it('should emit an inline style in head when documentHeadPageCss is set', () => {
      const reduxData = {
        settings: {
          collection: Immutable.fromJS({ customCSS: '' }),
        },
      };

      const component = shallow(
        <html lang="en">
          {headTag(dummyHelmet, [], reduxData, 'header { display: none }')}
        </html>
      );

      const pageStyle = component.find(`#${PAGE_STYLE_ELEMENT_ID}`);
      expect(pageStyle).toHaveLength(1);
      expect(pageStyle.prop('dangerouslySetInnerHTML').__html).toBe('header { display: none }');
    });

    it('should not emit page style when documentHeadPageCss is empty', () => {
      const reduxData = {
        settings: {
          collection: Immutable.fromJS({ customCSS: '' }),
        },
      };

      const component = shallow(
        <html lang="en">{headTag(dummyHelmet, [], reduxData, '')}</html>
      );

      expect(component.find(`#${PAGE_STYLE_ELEMENT_ID}`)).toHaveLength(0);
    });
  });
});
