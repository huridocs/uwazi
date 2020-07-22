import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { FormatMetadata } from '../FormatMetadata';
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
    const props = {
      templates: Immutable.fromJS([
        {
          _id: 'template',
          properties: [{ name: 'preview', type: 'preview' }],
        },
      ]),
      thesauris: Immutable.fromJS([{ _id: 'thesauris', values: [] }]),
      settings: Immutable.fromJS({ languages: [{ key: 'es', default: true }] }),
      entity: {
        template: 'template',
        documents: [{ _id: 'docId' }],
      },
      additionalMetadata: [{ more: 'data' }, { and: 'more' }],
    };

    const component = shallow(<FormatMetadata.WrappedComponent {...props} />);
    expect(component).toMatchSnapshot();
  });
});
