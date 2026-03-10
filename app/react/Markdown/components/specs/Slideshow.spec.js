import React from 'react';
import { shallow } from 'enzyme';
import Slideshow from '../Slideshow.js';

describe('Link', () => {
  beforeEach(() => {
    spyOn(console, 'warn');
  });
  it('should render a slideshow', () => {
    const component = shallow(
      <Slideshow>
        <img src="img1.jpg" />
        <img src="img2.jpg" />
      </Slideshow>
    );
    expect(component).toMatchSnapshot();
  });
});
