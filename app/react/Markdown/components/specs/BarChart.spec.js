/**
 * @jest-environment jsdom
 */
import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { XAxis, YAxis, Cell, BarChart, Tooltip } from 'recharts';

import BarChartComponent, { mapStateToProps } from '../BarChart.js';
import markdownDatasets from '../../markdownDatasets';
import { aggregationWithNestedValues } from '../../../Charts/utils/specs/fixtures/arrayUtilsFixtures';
import { nestedThesauri } from './fixture/nestedThesauri';

describe('BarChart Markdown component', () => {
  const state = {
    thesauris: Immutable.fromJS([
      {
        _id: 'tContext',
        values: [
          { id: 'id1', label: 'label1' },
          { id: 'id2', label: 'label2' },
          { id: 'id3', label: 'label3' },
          { id: 'id4', label: 'label4' },
        ],
      },
      nestedThesauri,
    ]),
  };

  const aggregationsLabels = {
    id1: 'label1',
    id2: 'label2',
    id3: 'label3',
    id4: 'label4',
  };
  const defaultAggregations = [{ id1: 25 }, { id2: 33 }, { missing: 45 }, { id3: 13 }, { id4: 0 }];

  const mockGetAggregations = values => {
    const aggregations = (values || defaultAggregations).map(item => {
      const key = Object.keys(item)[0];
      return { key, label: aggregationsLabels[key], filtered: { doc_count: item[key] } };
    });
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(Immutable.fromJS(aggregations));
  };

  const renderComponent = overridenProps => {
    const props = {
      ...mapStateToProps(state, { prop1: 'propValue' }),
      property: 'prop1',
      classname: 'custom-class',
      context: 'tContext',
      ...overridenProps,
    };

    return shallow(<BarChartComponent.WrappedComponent {...props} />);
  };

  const expectLabels = (component, labels) => {
    const expectedLabels = labels.map(label => expect.objectContaining({ label }));
    expect(component.find(BarChart).props().data).toEqual(expectedLabels);
  };

  it('should render the data passed by mapStateToProps', () => {
    mockGetAggregations();

    const component = renderComponent();

    expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  describe('when excludeZero', () => {
    it('should render without zero values', () => {
      mockGetAggregations();

      const component = renderComponent({ excludeZero: 'true' });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });
  });

  describe('when layout is vertical', () => {
    it('should render axis properly', () => {
      mockGetAggregations([{ key: 'id1', filtered: { doc_count: 25 } }]);

      const component = renderComponent({ layout: 'vertical' });

      expect(component.find(YAxis)).toMatchSnapshot();
      expect(component.find(XAxis)).toMatchSnapshot();
    });
  });

  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(undefinedValue);
    const props = mapStateToProps(state, { prop2: 'propValue' });
    const component = shallow(<BarChartComponent.WrappedComponent {...props} property="prop2" />);

    expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  describe('when passing maxCategories', () => {
    it('should only render the number of categories passed', () => {
      mockGetAggregations([{ id1: 25 }, { id2: 33 }, { id3: 13 }, { id4: 0 }]);

      const component = renderComponent({ maxCategories: '2' });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });

    it('should render others when passing aggregateOthers', () => {
      mockGetAggregations([{ id6: 57 }, { id2: 33 }, { id1: 25 }, { id3: 13 }, { id8: 2 }]);

      const component = renderComponent({ maxCategories: '2', aggregateOthers: 'true' });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });
  });

  describe('when passing pluckCategories configuration', () => {
    it('should allow selecting individual categories', () => {
      mockGetAggregations();
      const component = renderComponent({ pluckCategories: '["label3", "label1"]' });
      expectLabels(component, ['label1', 'label3']);
    });
  });

  describe('when passing sort configuration', () => {
    it('should allow sorting results', () => {
      mockGetAggregations();
      const component = renderComponent({ sort: '{"by": "label", "order": "desc"}' });
      expectLabels(component, ['label4', 'label3', 'label2', 'label1']);
    });
  });

  describe('when passing a labels map', () => {
    it('should pass the map data to layout formatter and format the tooltip', () => {
      mockGetAggregations();
      const component = renderComponent({ shortLabels: '{"label1": "L1", "label4": "L4"}' });

      expectLabels(component, ['label2', 'L1', 'label3', 'L4']);

      const { formatter } = component.find(Tooltip).props();

      expect(formatter('L1')).toBe('label1');
      expect(formatter('non existing label')).toBe('non existing label');
    });
  });

  describe('when passing colors', () => {
    it('should render with a single color', () => {
      mockGetAggregations();

      const component = renderComponent({ colors: '#ccc' });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      component.find(Cell).forEach(cell => {
        expect(cell.prop('fill')).toBe('#ccc');
      });
    });

    it('should render with several colors', () => {
      mockGetAggregations();

      const colors = ['#aaa', '#bbb', '#ccc', '#ddd', '#eee', '#000'];
      const component = renderComponent({ colors: colors.join(',') });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      component.find(Cell).forEach((cell, index) => {
        expect(cell.prop('fill')).toBe(colors[index]);
      });
    });

    it('should cycle the colors', () => {
      mockGetAggregations();

      const colors = ['#aaa', '#bbb'];
      const component = renderComponent({ colors: colors.join(',') });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      component.find(Cell).forEach((cell, index) => {
        expect(cell.prop('fill')).toBe(colors[index % 2]);
      });
    });
  });

  describe('when passing scatter parameter', () => {
    it('should display nested values with a composed label', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(aggregationWithNestedValues);

      const component = renderComponent({ scatter: 'true', context: 'nested' });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });
  });
});
