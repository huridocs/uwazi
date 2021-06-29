import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { mapStateToProps, ListChartComponent } from '../ListChart.js';
import markdownDatasets from '../../markdownDatasets';
import { dataWithNestedValues } from '../../../Charts/utils/specs/fixtures/arrayUtilsFixtures';

describe('ListChart Markdown component', () => {
  const state = {
    thesauris: Immutable.fromJS([
      {
        _id: 'tContext',
        values: [
          { id: 'id1', label: 'label1' },
          { id: 'id2', label: 'label2' },
          { id: 'id3', label: 'label3' },
        ],
      },
      {
        _id: 'nested',
        values: [
          {
            label: 'Nest A',
            id: 'v8rjiuewdlo',
            values: [
              {
                key: 'zlel1nllvs',
                label: 'A1',
              },
              {
                key: '7pu7fcxl8eg',
                label: 'A2',
              },
              {
                key: 'ipqlonrw89k',
                label: 'A3',
              },
            ],
          },
          {
            label: 'Nest B',
            id: 'rtaunx7j1t',
            values: [
              {
                key: 'jpw985bxwwg',
                label: 'B1',
              },
              {
                key: 'cbe3spt1k8o',
                label: 'B2',
              },
            ],
          },
        ],
      },
    ]),
  };

  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(undefinedValue);
    const props = mapStateToProps(state, { prop2: 'propValue' });
    const component = shallow(<ListChartComponent {...props} property="prop2" />);

    expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  it('should render the data passed by mapStateToProps', () => {
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(
      Immutable.fromJS([
        { key: 'id1', label: 'label1', filtered: { doc_count: 25 } },
        { key: 'id2', label: 'label2', filtered: { doc_count: 33 } },
        { key: 'missing', label: 'No value', filtered: { doc_count: 45 } },
        { key: 'id3', label: 'label3', filtered: { doc_count: 13 } },
      ])
    );

    const props = mapStateToProps(state, { prop1: 'propValue' });
    const component = shallow(
      <ListChartComponent {...props} property="prop1" classname="custom-class" context="tContext" />
    );

    expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });
  describe('when excludeZero', () => {
    it('should render without zero values', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(
        Immutable.fromJS([
          { key: 'id1', label: 'label1', filtered: { doc_count: 25 } },
          { key: 'id2', label: 'label2', filtered: { doc_count: 33 } },
          { key: 'missing', label: 'No value', filtered: { doc_count: 45 } },
          { key: 'id3', label: 'label3', filtered: { doc_count: 0 } },
        ])
      );

      const props = mapStateToProps(state, { prop1: 'propValue' });
      props.excludeZero = 'true';
      const component = shallow(
        <ListChartComponent
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

  describe('when passing scatter parameter', () => {
    it('should display nested values with a composed label', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(dataWithNestedValues);

      const props = mapStateToProps(state, { prop1: 'propValue' });
      const component = shallow(
        <ListChartComponent
          {...props}
          property="prop1"
          classname="custom-class"
          context="nested"
          scatter="true"
        />
      );

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });
  });
});
