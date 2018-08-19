import React from 'react';

import { shallow } from 'enzyme';

import { mapStateToProps, ValueComponent } from '../Value.js';
import markdownDatasets from '../../markdownDatasets';

let undefinedValue;

describe('Value', () => {
  it('should render the value passed by mapStateToProps', () => {
    spyOn(markdownDatasets, 'getMetadataValue').and.returnValue('some metadata value');
    const props = mapStateToProps('state', { prop1: 'propValue' });
    const component = shallow(<ValueComponent {...props}/>);

    expect(markdownDatasets.getMetadataValue).toHaveBeenCalledWith('state', { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  it('should render a placeholder when value is "null"', () => {
    spyOn(markdownDatasets, 'getMetadataValue').and.returnValue(undefinedValue);
    const props = mapStateToProps('state', { prop2: 'propValue2' });
    const component = shallow(<ValueComponent {...props}/>);

    expect(markdownDatasets.getMetadataValue).toHaveBeenCalledWith('state', { prop2: 'propValue2' });
    expect(component).toMatchSnapshot();
  });
});
