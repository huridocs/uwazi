import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';

import Metadata from '../Metadata';


describe('Metadata', () => {
  let props;

  function testSnapshot() {
    const component = shallow(<Metadata.WrappedComponent {...props} />);
    expect(component).toMatchSnapshot();
  }

  beforeEach(() => {
    props = {};
  });

  it('should render string values', () => {
    props.metadata = [{ label: 'Label', value: 'string value' }];
    testSnapshot();
  });

  it('should render array values separated by ", "', () => {
    props.metadata = [{ label: 'label array', value: [{ value: 'first_value' }, { value: 'second_value' }] }];
    testSnapshot();
  });

  it('should render a Markdown when the metadata is type mardown', () => {
    props.metadata = [{ label: 'label array', value: 'some markdown text', type: 'markdown' }];
    testSnapshot();
  });
});
