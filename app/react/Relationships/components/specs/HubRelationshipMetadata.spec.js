import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';

import HubRelationshipMetadata, { mapStateToProps } from '../HubRelationshipMetadata';

describe('HubRelationshipMetadata', () => {
  let props;
  let template;
  let range;
  let metadata;

  beforeEach(() => {
    template = 't1';

    const relationTypes = fromJS([{
      _id: 't1',
      properties: [
        { name: 'propertyA', label: 'labelA' },
        { name: 'propertyB', label: 'labelB' }
      ]
    }]);

    const thesauris = fromJS([{ _id: 'Value A' }, { _id: 'Value B' }]);

    props = Object.assign(
      mapStateToProps({ relationTypes, thesauris }),
      { relationship: fromJS({ template }) }
    );

    range = { text: 'Some quoted text' };
    metadata = { propertyA: 'Value B', propertyB: 'Value B' };
  });

  function testSnapshot() {
    const component = shallow(<HubRelationshipMetadata.WrappedComponent {...props} />);
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
    props.relationship = fromJS({ template, metadata });
    testSnapshot();
  });

  it('should render the metadata correctly when text is also present', () => {
    props.relationship = fromJS({ template, range, metadata });
    testSnapshot();
  });
});
