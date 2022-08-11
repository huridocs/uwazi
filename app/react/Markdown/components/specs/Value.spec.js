import React from 'react';
import { shallow, render } from 'enzyme';

import PagesContext from '../Context';
import { mapStateToProps, ValueComponent } from '../Value.js';
import markdownDatasets from '../../markdownDatasets';

let undefinedValue;

describe('Value', () => {
  it('should render the value passed by mapStateToProps', () => {
    spyOn(markdownDatasets, 'getMetadataValue').and.returnValue('some metadata value');
    const props = { property: 'propValue' };
    const mappedProps = mapStateToProps('state', props);
    const component = shallow(<ValueComponent {...{ ...props, ...mappedProps }} />);

    expect(markdownDatasets.getMetadataValue).toHaveBeenCalledWith('state', {
      property: 'propValue',
    });
    expect(component).toMatchSnapshot();
  });

  it('should render a placeholder when value is "null"', () => {
    spyOn(markdownDatasets, 'getMetadataValue').and.returnValue(undefinedValue);
    const props = { property: 'propValue2' };
    const mappedProps = mapStateToProps('state', props);
    const component = shallow(<ValueComponent {...{ ...props, ...mappedProps }} />);

    expect(markdownDatasets.getMetadataValue).toHaveBeenCalledWith('state', {
      property: 'propValue2',
    });
    expect(component).toMatchSnapshot();
  });

  describe('when using the context', () => {
    it('should render the value in the context path', () => {
      const rendered = render(
        <span>
          {
            //eslint-disable-next-line react/jsx-no-constructed-context-values
            <PagesContext.Provider value={{ name: 'Bruce Wayne' }}>
              <ValueComponent path="name" />
            </PagesContext.Provider>
          }
        </span>
      );
      expect(rendered).toMatchSnapshot();
    });
  });
});
