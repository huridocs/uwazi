import React from 'react';
import {shallow} from 'enzyme';
import {Icon} from '../Icon';
import Flag from 'react-flags';
import Immutable from 'immutable';

describe('Icon', () => {
  let component;
  let props;

  describe('Fontawesome', () => {
    beforeEach(() => {
      props = {
        data: {_id: 'iconid', type: 'Icons', label: 'iconlabel'},
        className: 'passed-classname',
        size: 'md'
      };
    });

    let render = () => {
      component = shallow(<Icon {...props} />);
    };

    it('should render a fontawesome icon', () => {
      render();
      expect(component.find('span').props().className).toBe('passed-classname');
      expect(component.find('i').props().className).toContain('fa fa-iconid');
    });

    it('should render different size icons', () => {
      render();
      expect(component.find('i').props().className).toContain('fa-2x');

      props.size = 'sm';
      render();
      expect(component.find('i').props().className).toContain('fa-lg');
    });
  });

  describe('Flags', () => {
    beforeEach(() => {
      props = {
        data: {_id: 'flagid', type: 'Flags', label: 'flaglabel'},
        className: 'passed-flag-classname',
        size: 'md'
      };
    });

    let render = () => {
      component = shallow(<Icon {...props} />);
    };

    it('should render a Flag icon', () => {
      render();
      expect(component.find('span').props().className).toBe('passed-flag-classname');
      expect(component.find(Flag).props().name).toBe('flagid');
      expect(component.find(Flag).props().basePath).toBe('/flag-images');
    });

    it('should render different size icons', () => {
      render();
      expect(component.find(Flag).props().pngSize).toBe(32);

      props.size = 'sm';
      render();
      expect(component.find(Flag).props().pngSize).toBe(24);
    });

    describe('when data is immutable', () => {
      it('should render a Flag icon', () => {
        props.data = Immutable.fromJS({_id: 'flagid', type: 'Flags', label: 'flaglabel'});
        render();
        expect(component.find('span').props().className).toBe('passed-flag-classname');
        expect(component.find(Flag).props().name).toBe('flagid');
        expect(component.find(Flag).props().basePath).toBe('/flag-images');
      });
    });
  });
});
