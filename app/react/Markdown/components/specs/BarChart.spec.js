/**
 * @jest-environment jsdom
 */
import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { XAxis, YAxis, Cell, BarChart, Tooltip } from 'recharts';

import BarChartComponent, { mapStateToProps } from '../BarChart.js';
import markdownDatasets from '../../markdownDatasets';

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
    ]),
  };

  const defaultAggregations = [
    { key: 'id1', filtered: { doc_count: 25 } },
    { key: 'id2', filtered: { doc_count: 33 } },
    { key: 'missing', filtered: { doc_count: 45 } },
    { key: 'id3', filtered: { doc_count: 13 } },
    { key: 'id4', filtered: { doc_count: 0 } },
  ];

  const mockGetAggregations = values => {
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(
      Immutable.fromJS(values || defaultAggregations)
    );
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
    expect(component.find(BarChart).props().data).toEqual([
      expect.objectContaining({ label: labels[0] }),
      expect.objectContaining({ label: labels[1] }),
      expect.objectContaining({ label: labels[2] }),
      expect.objectContaining({ label: labels[3] }),
    ]);
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
      mockGetAggregations([
        { key: 'id1', filtered: { doc_count: 25 } },
        { key: 'id2', filtered: { doc_count: 33 } },
        { key: 'id3', filtered: { doc_count: 13 } },
        { key: 'id4', filtered: { doc_count: 0 } },
      ]);

      const component = renderComponent({ maxCategories: '2' });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });

    it('should render others when passing aggregateOthers', () => {
      mockGetAggregations([
        { key: 'id6', filtered: { doc_count: 57 } },
        { key: 'id2', filtered: { doc_count: 33 } },
        { key: 'id1', filtered: { doc_count: 25 } },
        { key: 'id3', filtered: { doc_count: 13 } },
        { key: 'id8', filtered: { doc_count: 2 } },
      ]);

      const component = renderComponent({ maxCategories: '2', aggregateOthers: 'true' });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });
  });

  describe('when passing sort configuration', () => {
    it('should allow sorting by label', () => {
      mockGetAggregations();
      const component = renderComponent({ sort: '{"by": "label"}' });
      expectLabels(component, ['label1', 'label2', 'label3', 'label4']);
    });
  });

  describe('when passing a labels map', () => {
    it('should pass the map data to layout formatter and format the tooltip', () => {
      mockGetAggregations();
      const component = renderComponent({ shortLabels: '{"label1": "L1", "label4": "L4"}' });

      expectLabels(component, ['label2', 'L1', 'label3', 'L4']);

      const { labelFormatter } = component.find(Tooltip).props();

      expect(labelFormatter('L1')).toBe('label1');
      expect(labelFormatter('non existing label')).toBe('non existing label');
    });
  });

  describe('when passing colors', () => {
    it('should render with a single color', () => {
      mockGetAggregations([
        { key: 'id1', filtered: { doc_count: 25 } },
        { key: 'id2', filtered: { doc_count: 33 } },
        { key: 'missing', filtered: { doc_count: 45 } },
        { key: 'id3', filtered: { doc_count: 13 } },
        { key: 'id4', filtered: { doc_count: 0 } },
      ]);

      const component = renderComponent({ colors: '#ccc' });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      component.find(Cell).forEach(cell => {
        expect(cell.prop('fill')).toBe('#ccc');
      });
    });

    it('should render with several colors', () => {
      mockGetAggregations([
        { key: 'id1', filtered: { doc_count: 25 } },
        { key: 'id2', filtered: { doc_count: 33 } },
        { key: 'missing', filtered: { doc_count: 45 } },
        { key: 'id3', filtered: { doc_count: 13 } },
        { key: 'id4', filtered: { doc_count: 0 } },
      ]);

      const colors = ['#aaa', '#bbb', '#ccc', '#ddd', '#eee', '#000'];
      const component = renderComponent({ colors: colors.join(',') });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      component.find(Cell).forEach((cell, index) => {
        expect(cell.prop('fill')).toBe(colors[index]);
      });
    });

    it('should cycle the colors', () => {
      mockGetAggregations([
        { key: 'id1', filtered: { doc_count: 25 } },
        { key: 'id2', filtered: { doc_count: 33 } },
        { key: 'missing', filtered: { doc_count: 45 } },
        { key: 'id3', filtered: { doc_count: 13 } },
        { key: 'id4', filtered: { doc_count: 0 } },
      ]);

      const colors = ['#aaa', '#bbb'];
      const component = renderComponent({ colors: colors.join(',') });

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      component.find(Cell).forEach((cell, index) => {
        expect(cell.prop('fill')).toBe(colors[index % 2]);
      });
    });
  });
});
