import React from 'react';

import { shallow } from 'enzyme';

import MarkdownLink from '../MarkdownLink.js';

describe('Link', () => {
  it('should render a react-router Link when the url is relative', () => {
    const component = shallow(<MarkdownLink url="url" label="label" />);
    expect(component).toMatchSnapshot();
  });

  describe('when passing an icon property', () => {
    it('should render an extra div with icon class', () => {
      const component = shallow(<MarkdownLink url="url" label="label" icon="iconName"/>);
      expect(component).toMatchSnapshot();
    });

    describe('when passing a className property', () => {
      it('should append the className for the wrapping div', () => {
        const component = shallow(<MarkdownLink url="url" label="label" icon="iconName" className="extraClassName"/>);
        expect(component).toMatchSnapshot();
      });
    });
  });
});
