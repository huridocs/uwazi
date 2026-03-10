/**
 * @jest-environment jsdom
 */
import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { mapStateToProps, GaugeChartComponent } from '../GaugeChart.js';
import markdownDatasets from '../../markdownDatasets';

describe('GaugeChart Markdown component', () => {
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
    ]),
  };

  it('should render the data passed by mapStateToProps', () => {
    spyOn(markdownDatasets, 'getMetadataValue').and.returnValue(4);
    const ownProps = { property: 'progress' };
    const props = mapStateToProps(state, ownProps);
    const component = shallow(<GaugeChartComponent {...{ ...ownProps, ...props }} />);

    expect(markdownDatasets.getMetadataValue).toHaveBeenCalledWith(state, ownProps);
    expect(component).toMatchSnapshot();
  });

  it('should allow rendering value with prefix, suffix, and personalizing values', () => {
    spyOn(markdownDatasets, 'getMetadataValue').and.returnValue(4);
    const ownProps = {
      dataset: 'custom dataset',
      property: 'progress',
      max: '12',
      height: '300',
      classname: 'custom-class',
      colors: '#f00,#0f0',
    };

    const props = mapStateToProps(state, ownProps);
    const component = shallow(
      <GaugeChartComponent {...{ ...ownProps, ...props }}>
        Pre <div /> Suf
      </GaugeChartComponent>
    );

    expect(markdownDatasets.getMetadataValue).toHaveBeenCalledWith(state, ownProps);
    expect(component).toMatchSnapshot();
  });

  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(markdownDatasets, 'getMetadataValue').and.returnValue(undefinedValue);

    const props = mapStateToProps(state, { prop2: 'propValue' });
    const component = shallow(<GaugeChartComponent {...props} property="prop2" />);

    expect(markdownDatasets.getMetadataValue).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });
});
