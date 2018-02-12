import React from 'react';
import MarkdownYoutube from '../MarkdownYoutube';
import {shallow} from 'enzyme';

describe('MarkdownYoutube', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      config: '(https://www.youtube.com/253530307)'
    };
  });

  let render = () => {
    component = shallow(<MarkdownYoutube {...props} />);
  };

  describe('render', () => {
    it('should render an iframe with the correct video id', () => {
      render();
      expect(component.find('iframe').props().src).toBe('https://www.youtube.com/embed/253530307?rel=0&amp;showinfo=0');
    });
  });
});
