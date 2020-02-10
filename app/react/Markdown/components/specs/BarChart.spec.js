/**
 * @jest-environment jsdom
 */
import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { XAxis, YAxis } from 'recharts';

import { mapStateToProps, BarChartComponent } from '../BarChart.js';
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

  it('should render the data passed by mapStateToProps', () => {
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(
      Immutable.fromJS([
        { key: 'id1', filtered: { doc_count: 25 } },
        { key: 'id2', filtered: { doc_count: 33 } },
        { key: 'missing', filtered: { doc_count: 45 } },
        { key: 'id3', filtered: { doc_count: 13 } },
        { key: 'id4', filtered: { doc_count: 0 } },
      ])
    );

    const props = mapStateToProps(state, { prop1: 'propValue' });
    const component = shallow(
      <BarChartComponent {...props} property="prop1" classname="custom-class" context="tContext" />
    );

    expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  describe('when excludeZero', () => {
    it('should render without zero values', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(
        Immutable.fromJS([
          { key: 'id1', filtered: { doc_count: 25 } },
          { key: 'id2', filtered: { doc_count: 33 } },
          { key: 'missing', filtered: { doc_count: 45 } },
          { key: 'id3', filtered: { doc_count: 13 } },
          { key: 'id4', filtered: { doc_count: 0 } },
        ])
      );

      const props = mapStateToProps(state, { prop1: 'propValue' });
      props.excludeZero = 'true';
      const component = shallow(
        <BarChartComponent
          {...props}
          property="prop1"
          classname="custom-class"
          context="tContext"
        />
      );

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });
  });

  describe('when layout is vertical', () => {
    it('should render axis properly', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(
        Immutable.fromJS([{ key: 'id1', filtered: { doc_count: 25 } }])
      );

      const props = mapStateToProps(state, { prop1: 'propValue' });
      props.layout = 'vertical';
      const component = shallow(
        <BarChartComponent
          {...props}
          property="prop1"
          classname="custom-class"
          context="tContext"
        />
      );

      expect(component.find(YAxis)).toMatchSnapshot();
      expect(component.find(XAxis)).toMatchSnapshot();
    });
  });

  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(undefinedValue);
    const props = mapStateToProps(state, { prop2: 'propValue' });
    const component = shallow(<BarChartComponent {...props} property="prop2" />);

    expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  describe('when passing maxCategories', () => {
    it('should only render the number of categories passed', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(
        Immutable.fromJS([
          { key: 'id1', filtered: { doc_count: 25 } },
          { key: 'id2', filtered: { doc_count: 33 } },
          { key: 'id3', filtered: { doc_count: 13 } },
          { key: 'id4', filtered: { doc_count: 0 } },
        ])
      );

      const props = mapStateToProps(state, { prop1: 'propValue' });
      props.maxCategories = '2';
      const component = shallow(
        <BarChartComponent
          {...props}
          property="prop1"
          classname="custom-class"
          context="tContext"
        />
      );

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });

    it('should render others when passing aggregateOthers', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(
        Immutable.fromJS([
          { key: 'id6', filtered: { doc_count: 57 } },
          { key: 'id2', filtered: { doc_count: 33 } },
          { key: 'id1', filtered: { doc_count: 25 } },
          { key: 'id3', filtered: { doc_count: 13 } },
          { key: 'id8', filtered: { doc_count: 2 } },
        ])
      );

      const props = mapStateToProps(state, { prop1: 'propValue' });
      props.maxCategories = '2';
      props.aggregateOthers = 'true';
      const component = shallow(
        <BarChartComponent
          {...props}
          property="prop1"
          classname="custom-class"
          context="tContext"
        />
      );

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });
  });
});
