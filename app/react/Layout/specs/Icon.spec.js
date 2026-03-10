import React from 'react';
import { shallow } from 'enzyme';
import { Icon as UIIcon } from 'UI';
import { Icon } from '../Icon';

describe('Icon', () => {
  let component;
  let props;

  describe('Fontawesome', () => {
    beforeEach(() => {
      props = {
        data: { _id: 'iconid', type: 'Icons', label: 'iconlabel' },
        className: 'passed-classname',
        size: 'md',
      };
    });

    const render = () => {
      component = shallow(<Icon {...props} />);
    };

    it('should render a fontawesome icon', () => {
      render();
      expect(component.find('span').props().className).toBe('passed-classname');
      expect(component.find(UIIcon).props().icon).toBe('iconid');
    });

    it('should render different size icons', () => {
      render();
      expect(component.find(UIIcon).props().size).toBe('2x');

      props.size = 'sm';
      render();
      expect(component.find(UIIcon).props().size).toBe('lg');
    });
  });

  describe('Flags', () => {
    beforeEach(() => {
      props = {
        data: { _id: 'JPN', type: 'Flags', label: 'flaglabel' },
        className: 'passed-flag-classname',
        size: 'md',
      };
    });

    const render = () => {
      component = shallow(<Icon {...props} />);
    };

    it('should render a Flag icon', () => {
      render();
      expect(component.find('span.fi').props().className).toContain('passed-flag-classname');
      expect(component.find('span.fi').props().className).toContain('fi-jp');
    });
  });
});
