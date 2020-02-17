import React from 'react';

import { shallow } from 'enzyme';

import FormatMetadata from '../FormatMetadata';
import { metadataSelectors } from '../../selectors';

describe('FormatMetadata', () => {
  it('should render Metadata component passing the formatted metadata', () => {
    spyOn(metadataSelectors, 'formatMetadata').and.returnValue([{ formated: 'metadata' }]);
    const props = {
      templates: [],
      thesauris: [],
      entity: {},
      sortedProperty: 'sortedProperty',
    };
    const component = shallow(<FormatMetadata.WrappedComponent {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('should unshift additional metadata if passed', () => {
    spyOn(metadataSelectors, 'formatMetadata').and.returnValue([{ formated: 'metadata' }]);
    const props = {
      templates: [],
      thesauris: [],
      entity: {},
      sortedProperty: 'sortedProperty',
      additionalMetadata: [{ more: 'data' }, { and: 'more' }],
    };
    const component = shallow(<FormatMetadata.WrappedComponent {...props} />);
    expect(component).toMatchSnapshot();
  });
});
