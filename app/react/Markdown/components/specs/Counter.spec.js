import React from 'react';

import { shallow } from 'enzyme';

import { mapStateToProps, CounterComponent } from '../Counter.js';
import markdownDatasets from '../../markdownDatasets';

describe('Counter', () => {
  it('should render the count passed by mapStateToProps', () => {
    spyOn(markdownDatasets, 'getAggregation').and.returnValue(5);
    const props = mapStateToProps('state', { prop1: 'propValue' });
    const component = shallow(<CounterComponent {...props}/>);

    expect(markdownDatasets.getAggregation).toHaveBeenCalledWith('state', { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  it('should render a placeholder when count is "null"', () => {
    let undefinedValue;
    spyOn(markdownDatasets, 'getAggregation').and.returnValue(undefinedValue);
    const props = mapStateToProps('state', { prop1: 'propValue' });
    const component = shallow(<CounterComponent {...props}/>);

    expect(markdownDatasets.getAggregation).toHaveBeenCalledWith('state', { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });
});
