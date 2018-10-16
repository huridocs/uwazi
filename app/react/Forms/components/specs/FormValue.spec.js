import React from 'react';

import { shallow } from 'enzyme';

import { mapStateToProps, FormValue } from '../FormValue';

describe('FormValue', () => {
  let props;
  beforeEach(() => {
    const state = { form: { value: 'value' } };
    const model = 'form.value';
    props = mapStateToProps(state, { model });
  });

  it('should call render prop with value selected', () => {
    const component = shallow(<FormValue {...props}>{value => <span>{value}</span>}</FormValue>);
    expect(component).toMatchSnapshot();
  });
});
