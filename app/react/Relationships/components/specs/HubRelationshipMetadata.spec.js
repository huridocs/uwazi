import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';

import HubRelationshipMetadata from '../HubRelationshipMetadata';

describe('HubRelationshipMetadata', () => {
  let props;
  let range;
  let metadata;

  beforeEach(() => {
    props = {
      relationship: fromJS({})
    };

    range = { text: 'Some quoted text' };
    metadata = { propertyA: 'Value B', propertyB: 'Value B' };
  });

  function testSnapshot() {
    const component = shallow(<HubRelationshipMetadata {...props} />);
    expect(component).toMatchSnapshot();
  }


  it('should render null if relationship lacks metadata or text', () => {
    testSnapshot();
  });

  it('should render the text quote correctly', () => {
    props.relationship = fromJS({ range });
    testSnapshot();
  });

  it('should render the metadata correctly', () => {
    props.relationship = fromJS({ metadata });
    testSnapshot();
  });

  it('should render the metadata correctly when text is also present', () => {
    props.relationship = fromJS({ range, metadata });
    testSnapshot();
  });
});
