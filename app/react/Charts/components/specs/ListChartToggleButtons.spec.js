import React from 'react';
import {shallow} from 'enzyme';
import {browserHistory} from 'react-router';

import {ListChartToggleButtons} from '../ListChartToggleButtons';

describe('ListChartToggleButtons', () => {
  let component;
  let props;

  let render = () => {
    component = shallow(<ListChartToggleButtons {...props} />);
  };

  describe('render()', () => {
    beforeEach(() => {
      props = {};

      spyOn(browserHistory, 'getCurrentLocation').and.returnValue({pathname: '/location', query: {q: '(a:1)'}});
      spyOn(browserHistory, 'push');
    });

    it('should render two buttons, list selected by default', () => {
      render();

      expect(component.find('button').length).toBe(2);
      expect(component.find('button').at(0).props().className).toContain('btn-success');
      expect(component.find('button').at(1).props().className).toContain('btn-default');
    });

    it('should selected chart if active', () => {
      props.active = 'chart';
      render();

      expect(component.find('button').length).toBe(2);
      expect(component.find('button').at(0).props().className).toContain('btn-default');
      expect(component.find('button').at(1).props().className).toContain('btn-success');
    });

    it('should change the browserHistory to reflect the new selection', () => {
      render();
      const listSelect = component.find('button').at(0);
      const chartSelect = component.find('button').at(1);

      listSelect.simulate('click');
      expect(browserHistory.push.calls.mostRecent().args[0]).toBe('/location?q=(a:1)&view=list');

      chartSelect.simulate('click');
      expect(browserHistory.push.calls.mostRecent().args[0]).toBe('/location?q=(a:1)&view=chart');
    });
  });
});
