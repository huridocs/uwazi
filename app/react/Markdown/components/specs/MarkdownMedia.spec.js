/**
 * @jest-environment jsdom
 */

import React from 'react';
import ReactPlayer from 'react-player';

import { renderConnectedMount } from 'app/utils/test/renderConnected';
import MarkdownMedia from '../MarkdownMedia';

describe('MarkdownMedia', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      config:
        '(https://www.vimeo.com/253530307, {"timelinks": {"02:10": "A rude awakening", "05:30": "Finally, you are up!"}})',
    };
  });

  const render = () => {
    component = renderConnectedMount(() => <MarkdownMedia {...props} />);
  };

  describe('render', () => {
    it('should render an iframe with the correct video id', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    it('should use compact class name if compact prop is set', () => {
      props.compact = true;
      render();
      expect(component).toMatchSnapshot();
    });

    describe('Video timeline', () => {
      let ReactPlayerInstance;
      beforeEach(() => {
        render();
        ReactPlayerInstance = component.find(ReactPlayer).instance();
        ReactPlayerInstance.seekTo = jasmine.createSpy('seekTo');
      });

      it('should render the timelinks', () => {
        const links = component.find('.timelink');
        expect(links.length).toBe(2);
      });

      it('should interact with the player', () => {
        const firstTimeLink = component.find('.timelink-time-label').at(0);
        const secondTimeLink = component.find('.timelink-time-label').at(1);
        firstTimeLink.simulate('click');
        expect(ReactPlayerInstance.seekTo).toHaveBeenCalledWith(2 * 60 + 10);
        secondTimeLink.simulate('click');
        expect(ReactPlayerInstance.seekTo).toHaveBeenCalledWith(5 * 60 + 30);
      });
    });
  });
});
