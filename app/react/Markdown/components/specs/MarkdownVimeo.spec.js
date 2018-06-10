import React from 'react';
import MarkdownVimeo from '../MarkdownVimeo';
import {mount} from 'enzyme';

describe('MarkdownVimeo', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      config: '(https://www.vimeo.com/253530307, {"timelinks": {"02:10": "A rude awakening", "05:30": "Finally, you are up!"}})'
    };
  });

  let render = () => {
    component = mount(<MarkdownVimeo {...props} />);
  };

  describe('render', () => {
    it('should render an iframe with the correct video id', () => {
      render();
      expect(component.find('ReactPlayer').props().url)
      .toBe('https://www.vimeo.com/253530307');
    });
  });
});
