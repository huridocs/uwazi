import React from 'react';
import { mount } from 'enzyme';
import MarkdownMedia from '../MarkdownMedia';

describe('MarkdownMedia', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      config: '(https://www.vimeo.com/253530307, {"timelinks": {"02:10": "A rude awakening", "05:30": "Finally, you are up!"}})'
    };
  });

  const render = () => {
    component = mount(<MarkdownMedia {...props} />);
  };

  describe('render', () => {
    it('should render an iframe with the correct video id', () => {
      render();
      expect(component.find('ReactPlayer').props().url)
      .toBe('https://www.vimeo.com/253530307');
    });


    describe('Video timeline', () => {
      it('should render the timelinks and call the player onClick', () => {
        render();

        const links = component.find('.timelink');
        expect(links.length).toBe(2);

        const { player } = component.instance().refs;
        spyOn(player, 'seekTo');
        const firstTimeLink = component.find('.timelink').at(0);
        const secondTimeLink = component.find('.timelink').at(1);
        firstTimeLink.simulate('click');
        expect(player.seekTo).toHaveBeenCalledWith(2 * 60 + 10);
        secondTimeLink.simulate('click');
        expect(player.seekTo).toHaveBeenCalledWith(5 * 60 + 30);
      });
    });
  });
});
