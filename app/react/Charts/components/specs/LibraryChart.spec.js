import React from 'react';
import {shallow} from 'enzyme';

import {LibraryChart} from '../LibraryChart';

import Pie from '../Pie';
import Bar from '../Bar';

describe('LibraryChart', () => {
  let component;
  let instance;
  let props;

  let render = () => {
    component = shallow(<LibraryChart {...props} />);
    instance = component.instance();
  };

  describe('render()', () => {
    beforeEach(() => {
      props = {
        options: [],
        label: 'chartLabel'
      };
    });

    it('should include label', () => {
      render();
      expect(component.find('p').text()).toBe('chartLabel');
    });

    describe('type toggle buttons', () => {
      it('should switch between Pie and Bar', () => {
        render();
        const toPieButton = component.find('button').at(0);
        const toBarButton = component.find('button').at(1);

        expect(instance.state.type).toBe('pie');

        toBarButton.simulate('click');
        expect(instance.state.type).toBe('bar');

        toPieButton.simulate('click');
        expect(instance.state.type).toBe('pie');
      });
    });

    it('should render a Pie by default', () => {
      render();
      expect(component.find(Pie).length).toBe(1);
      expect(component.find(Bar).length).toBe(0);

      expect(component.find(Pie).props().data).toEqual(props.options);
    });

    it('should render a Bar if set in type', () => {
      render();
      component.setState({type: 'chart'});

      expect(component.find(Pie).length).toBe(0);
      expect(component.find(Bar).length).toBe(1);

      expect(component.find(Bar).props().data).toEqual(props.options);
      expect(component.find(Bar).props().chartLabel).toEqual('chartLabel');
    });

    describe('result clustering', () => {
      beforeEach(() => {
        props.options = [
          {label: 'a', results: 1},
          {label: 'b', results: 1},
          {label: 'c', results: 3},
          {label: 'd', results: 1},
          {label: 'e', results: 1},
          {label: 'f', results: 7},
          {label: 'g', results: 1},
          {label: 'h', results: 1},
          {label: 'i', results: 1},
          {label: 'j', results: 1},
          {label: 'k', results: 1},
          {label: 'l', results: 1},
          {label: 'm', results: 1},
          {label: 'n', results: 1},
          {label: 'o', results: 1},
          {label: 'p', results: 1},
          {label: 'q', results: 1},
          {label: 'r', results: 2},
          {label: 's', results: 3}
        ];
      });

      it('should cluster the options for the Pie chart', () => {
        render();

        expect(component.find(Pie).props().data).not.toEqual(props.options);
        expect(component.find(Pie).props().data[0]).toEqual(props.options[0]);
        expect(component.find(Pie).props().data[2]).toEqual(props.options[2]);
        expect(component.find(Pie).props().data[5]).toEqual(props.options[5]);
        expect(component.find(Pie).props().data[instance.maxPieItems]).toEqual({label: 'Other', results: 8});
      });

      it('should not cluster the options for the Bar chart', () => {
        render();
        component.setState({type: 'chart'});

        expect(component.find(Bar).props().data).toEqual(props.options);
        expect(component.find(Bar).props().data[instance.maxPieItems]).not.toEqual({label: 'Other', results: 8});
      });
    });
  });
});
