"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _reactPlayer = _interopRequireDefault(require("react-player"));

var _MarkdownMedia = _interopRequireDefault(require("../MarkdownMedia"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('MarkdownMedia', () => {
  let component;
  let instance;
  let props;

  beforeEach(() => {
    props = {
      config: '(https://www.vimeo.com/253530307, {"timelinks": {"02:10": "A rude awakening", "05:30": "Finally, you are up!"}})' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_MarkdownMedia.default, props));
    instance = component.instance();
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

    it('should assign the ReactPlayer ref to this.player', () => {
      const playerRef = {};
      render();

      const ReactPlayerComponent = component.find(_reactPlayer.default);
      ReactPlayerComponent.getElement().ref(playerRef);
      expect(instance.player).toBe(playerRef);
    });

    describe('Video timeline', () => {
      beforeEach(() => {
        render();
        instance.player = { seekTo: jasmine.createSpy('seekTo') };
      });

      it('should render the timelinks', () => {
        const links = component.find('.timelink');
        expect(links.length).toBe(2);
      });

      it('should interact with the player', () => {
        const firstTimeLink = component.find('.timelink').at(0);
        const secondTimeLink = component.find('.timelink').at(1);

        firstTimeLink.simulate('click');
        expect(instance.player.seekTo).toHaveBeenCalledWith(2 * 60 + 10);
        secondTimeLink.simulate('click');
        expect(instance.player.seekTo).toHaveBeenCalledWith(5 * 60 + 30);
      });
    });
  });
});