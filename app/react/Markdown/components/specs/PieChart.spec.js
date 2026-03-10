/**
 * @jest-environment jsdom
 */
import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { Pie, Tooltip } from 'recharts';

import { aggregationWithNestedValues } from '../../../Charts/utils/specs/fixtures/arrayUtilsFixtures';
import { mapStateToProps, PieChartComponent } from '../PieChart.js';
import markdownDatasets from '../../markdownDatasets';
import { nestedThesauri } from './fixture/nestedThesauri';

describe('PieChart Markdown component', () => {
  const state = {
    thesauris: Immutable.fromJS([
      {
        _id: 'tContext',
        values: [
          { id: 'id1', label: 'label1' },
          { id: 'id2', label: 'label2' },
          { id: 'id3', label: 'label3' },
          { id: 'id6', label: 'label6' },
          { id: 'id7', label: 'label7' },
          { id: 'id8', label: 'label8' },
        ],
      },
      nestedThesauri,
    ]),
  };

  it('should render the data passed by mapStateToProps and ignore "0" values', () => {
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(
      Immutable.fromJS([
        { key: 'id1', label: 'label1', filtered: { doc_count: 25 } },
        { key: 'id2', label: 'label2', filtered: { doc_count: 33 } },
        { key: 'missing', label: 'No value', filtered: { doc_count: 45 } },
        { key: 'id3', label: 'label3', filtered: { doc_count: 13 } },
        { key: 'id6', label: 'label6', filtered: { doc_count: 0 } },
        { key: 'id8', label: 'label8', filtered: { doc_count: 0 } },
      ])
    );

    const props = mapStateToProps(state, { prop1: 'propValue' });
    const component = shallow(
      <PieChartComponent {...props} property="prop1" classname="custom-class" context="tContext" />
    );

    expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  describe('when passing maxCategories', () => {
    const mockedAggregations = Immutable.fromJS([
      { key: 'id6', label: 'label6', filtered: { doc_count: 57 } },
      { key: 'id2', label: 'label2', filtered: { doc_count: 33 } },
      { key: 'id1', label: 'label1', filtered: { doc_count: 25 } },
      { key: 'id3', label: 'label3', filtered: { doc_count: 13 } },
      { key: 'id8', label: 'label8', filtered: { doc_count: 2 } },
    ]);

    it('should only render the number of categories passed', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(mockedAggregations);

      const props = mapStateToProps(state, { prop1: 'propValue' });
      props.maxCategories = '2';
      const component = shallow(
        <PieChartComponent
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
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(mockedAggregations);

      const props = mapStateToProps(state, { prop1: 'propValue' });
      props.maxCategories = '2';
      props.aggregateOthers = 'true';
      const component = shallow(
        <PieChartComponent
          {...props}
          property="prop1"
          classname="custom-class"
          context="tContext"
        />
      );

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });

    it('should not render others when sum is 0', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(
        Immutable.fromJS([
          { key: 'id6', label: 'label6', filtered: { doc_count: 57 } },
          { key: 'id2', label: 'label2', filtered: { doc_count: 33 } },
        ])
      );

      const props = mapStateToProps(state, { prop1: 'propValue' });
      props.maxCategories = '3';
      props.aggregateOthers = 'true';
      const component = shallow(
        <PieChartComponent
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

  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(markdownDatasets, 'getAggregations').and.returnValue(undefinedValue);
    const props = mapStateToProps(state, { prop2: 'propValue' });
    const component = shallow(<PieChartComponent {...props} property="prop2" />);

    expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  describe('when prop show label', () => {
    it('should use pieChartLabel', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(
        Immutable.fromJS([{ key: 'id1', label: 'label1', filtered: { doc_count: 25 } }])
      );

      const props = mapStateToProps(state, { prop1: 'propValue' });
      props.showLabel = 'true';

      const component = shallow(
        <PieChartComponent
          {...props}
          property="prop1"
          classname="custom-class"
          context="tContext"
        />
      );
      expect(component.find(Pie).props().label).toMatchSnapshot();
      expect(component.find(Pie).props().labelLine).toBe(true);
      expect(component.find(Tooltip).length).toBe(0);
    });
  });
  describe('when passing pluckCategories configuration', () => {
    it('should allow selecting individual categories', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(
        Immutable.fromJS([
          { key: 'id1', label: 'label1', filtered: { doc_count: 25 } },
          { key: 'id2', label: 'label2', filtered: { doc_count: 33 } },
          { key: 'id3', label: 'label3', filtered: { doc_count: 13 } },
          { key: 'id6', label: 'label4', filtered: { doc_count: 12 } },
          { key: 'id7', label: 'label5', filtered: { doc_count: 12 } },
          { key: 'id8', label: 'label6', filtered: { doc_count: 20 } },
        ])
      );
      const props = mapStateToProps(state, { prop1: 'propValue' });
      const component = shallow(
        <PieChartComponent
          {...props}
          property="prop1"
          classname="custom-class"
          context="tContext"
          pluckCategories='["label3","label1"]'
        />
      );
      const labels = ['label1', 'label3'];
      const expectedLabels = labels.map(label => expect.objectContaining({ label }));
      expect(component.find(Pie).props().data).toEqual(expectedLabels);
    });
  });

  describe('when passing scatter', () => {
    it('should display nested values with a composed label', () => {
      spyOn(markdownDatasets, 'getAggregations').and.returnValue(aggregationWithNestedValues);

      const props = mapStateToProps(state, { prop1: 'propValue' });
      const component = shallow(
        <PieChartComponent
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          property="prop1"
          classname="custom-class"
          context="nested"
          scatter="true"
        />
      );

      expect(markdownDatasets.getAggregations).toHaveBeenCalledWith(state, {
        prop1: 'propValue',
      });
      expect(component).toMatchSnapshot();
    });
  });
});
