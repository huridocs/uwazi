import React from 'react';
import { shallow } from 'enzyme';
import MarkdownLink from '../MarkdownLink.js';

describe('Link', () => {
  beforeEach(() => {
    spyOn(console, 'warn');
  });
  it('should render a react-router Link', () => {
    const component = shallow(<MarkdownLink url="url">label</MarkdownLink>);
    expect(component).toMatchSnapshot();
  });

  it('should allow to set a custom class to the component', () => {
    const component = shallow(
      <MarkdownLink url="url" className="custom class">
        label
      </MarkdownLink>
    );
    expect(component).toMatchSnapshot();
  });

  it('should allow nesting children inside', () => {
    const component = shallow(
      <MarkdownLink url="url">
        <div>Extra content</div>
        <span>Label</span>
      </MarkdownLink>
    );
    expect(component).toMatchSnapshot();
  });
});
