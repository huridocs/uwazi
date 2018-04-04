import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';

import Metadata from '../Metadata';


describe('Metadata', () => {
  let props;

  function testSnapshot() {
    const tree = shallow(<Metadata.WrappedComponent {...props} />);
    expect(tree).toMatchSnapshot();
  }

  beforeEach(() => {
    props = {};
  });

  it('should render string values', () => {
    props.metadata = [{ label: 'Label', value: 'string value' }];
    testSnapshot();
  });
});
