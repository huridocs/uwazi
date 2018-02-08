import React from 'react';
import MarkdownVimeo from '../MarkdownVimeo';
import {mount} from 'enzyme';

describe('MarkdownVimeo', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      config: '(https://www.vimeo.com/253530307)'
    };
  });

  let render = () => {
    component = mount(<MarkdownVimeo {...props} />);
  };

  describe('render', () => {
    it('should render an iframe with the correct video id', () => {
      render();
      expect(component.find('iframe').props().src).toBe('https://player.vimeo.com/video/253530307');
    });

    describe('Video timeline', () => {
      it('should render the timelinks and call the player onClick', () => {
        props = {config: '(253530307, {"timelinks": {"02:10": "A rude awakening", "05:30": "Finally, you are up!"}})'};
        render();
        const player = component.instance().player;
        spyOn(player, 'setCurrentTime');
        const firstTimeLink = component.find('.timelink').at(0);
        const secondTimeLink = component.find('.timelink').at(1);
        firstTimeLink.simulate('click');
        expect(player.setCurrentTime).toHaveBeenCalledWith(2 * 60 + 10);
        secondTimeLink.simulate('click');
        expect(player.setCurrentTime).toHaveBeenCalledWith(5 * 60 + 30);
      });
    });
  });
});
