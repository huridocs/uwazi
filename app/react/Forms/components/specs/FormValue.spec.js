import React from 'react';

import { shallow } from 'enzyme';

import { mapStateToProps, StoreValue } from '../StoreValue';

describe('StoreValue', () => {
  let props;
  beforeEach(() => {
    const state = { form: { value: 'value' } };
    const model = 'form.value';
    props = mapStateToProps(state, { model });
  });

  it('should call render prop with value selected', () => {
    const component = shallow(<StoreValue {...props}>{value => <span>{value}</span>}</StoreValue>);
    expect(component).toMatchSnapshot();
  });
});
