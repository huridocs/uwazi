/** @format */

import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';

import HubRelationshipMetadata, { mapStateToProps } from '../HubRelationshipMetadata';

describe('HubRelationshipMetadata', () => {
  let props;
  let template;
  let reference;
  let metadata;

  beforeEach(() => {
    template = 't1';

    const relationTypes = fromJS([
      {
        _id: 't1',
        properties: [
          { name: 'propertyA', label: 'labelA' },
          { name: 'propertyB', label: 'labelB' },
          { name: 'propertyC', label: 'labelC', type: 'multiselect' },
        ],
      },
    ]);

    const thesauris = fromJS([{ _id: 'Value C1' }, { _id: 'Value C2' }]);

    props = Object.assign(mapStateToProps({ relationTypes, thesauris }), {
      relationship: fromJS({ template }),
    });

    reference = { text: 'Some quoted text' };
    metadata = {
      propertyA: [{ value: 'Value B' }],
      propertyB: [{ value: 'Value B' }],
      propertyC: [{ value: 'Value C1' }, { value: 'Value C2' }],
    };
  });

  function testSnapshot() {
    const component = shallow(<HubRelationshipMetadata.WrappedComponent {...props} />);
    expect(component).toMatchSnapshot();
  }

  it('should render null if relationship lacks metadata or text', () => {
    testSnapshot();
  });

  it('should render the text quote correctly', () => {
    props.relationship = fromJS({ reference });
    testSnapshot();
  });

  it('should render the metadata correctly', () => {
    props.relationship = fromJS({ template, metadata });
    testSnapshot();
  });

  it('should render the metadata correctly when text is also present', () => {
    props.relationship = fromJS({ template, reference, metadata });
    testSnapshot();
  });
});
