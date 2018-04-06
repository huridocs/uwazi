import React from 'react';

import { shallow } from 'enzyme';

import Metadata from '../Metadata';


describe('Metadata', () => {
  let props;

  function testSnapshot() {
    const component = shallow(<Metadata {...props} />);
    expect(component).toMatchSnapshot();
  }

  beforeEach(() => {
    props = {};
  });

  it('should not render metadata without value', () => {
    props.metadata = [
      { label: 'Label', value: 'string value' },
      { label: 'Label2' }
    ];
    testSnapshot();
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

  it('should render property not have this item when type is null', () => {
    props.metadata = [{ label: 'metadata without property', type: null }];
    testSnapshot();
  });

  it('should render sorted property with sorted styles', () => {
    props.metadata = [{ label: 'sortedBy', value: 'string value', sortedBy: true }];
    testSnapshot();
  });

  it('should render links when the property has url', () => {
    props.metadata = [{ label: 'withUrl', value: 'string value', url: 'url' }];
    testSnapshot();
  });

  it('should render links when multiple properties have url', () => {
    props.metadata = [{ label: 'label array', value: [{ value: 'first_value', url: 'url1' }, { value: 'second_value', url: 'url2' }] }];
    testSnapshot();
  });

  it('should not render an empty list', () => {
    props.metadata = [{ label: 'label array', value: [] }];
    testSnapshot();
  });

  describe('when passing compact prop', () => {
    it('should pass it to ValueList', () => {
      props.metadata = [{ label: 'label array', value: [{ value: 'first_value', url: 'url1' }, { value: 'second_value', url: 'url2' }] }];
      props.compact = true;
      testSnapshot();
    });
  });
});
