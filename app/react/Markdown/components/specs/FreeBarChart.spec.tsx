/**
 * @format
 * @jest-environment jsdom
 */

import React from 'react';
import { shallow } from 'enzyme';

import FreeBarChart, {
  FreeBarChartProps,
  CustomTooltip,
  CustomTooltipProps,
} from '../FreeBarChart';

describe('FreeBarChart', () => {
  let component: any;

  let props: Partial<FreeBarChartProps>;

  const render = () => {
    component = shallow<FreeBarChart>(<FreeBarChart {...props} />);
  };

  const expectMatch = () => {
    render();
    expect(component).toMatchSnapshot();
  };

  it('should output empty div if no data', () => {
    expectMatch();
  });

  describe('when data', () => {
    beforeEach(() => {
      props = {
        data: '[{"label":"col1", "results": 3, "otherProp": 5, "lastProp": 2},{"label":"col2", "results": 4, "otherProp": 2, "lastProp": 3}]',
      };
    });

    it('should render basic data with correct defaults', () => {
      expectMatch();
    });

    it('should allow personalizing the options', () => {
      props.classname = 'custom-class';
      props.layout = 'vertical';
      props.dataKeys = '[{ "otherProp": "Button label" }]';
      props.colors = '#ff0,#00f';
      expectMatch();
    });

    it('should allow changing dataKeys with buttons', () => {
      props.dataKeys = '[{ "otherProp": "Button 1 label" }, { "lastProp": "Button 2 label" }]';
      expectMatch();
      const lastPropButton = component.find('button').at(1);
      lastPropButton.simulate('click');
      expect(component).toMatchSnapshot();
    });
  });
});

describe('CustomTooltip', () => {
  let props: Partial<CustomTooltipProps>;
  let component: any;

  const render = () => {
    component = shallow(<CustomTooltip {...props} />);
  };

  const expectMatch = () => {
    render();
    expect(component).toMatchSnapshot();
  };

  it('should not render on inactive', () => {
    expectMatch();
  });

  it('should render the tooltip on active', () => {
    props = { active: true, payload: [{ value: 3 }], label: 'tooltipLabel' };
    expectMatch();
  });

  it('should render with payload color', () => {
    props = { active: true, payload: [{ value: 5, color: '#f00' }], label: 'tooltipLabel' };
    expectMatch();
  });
});
