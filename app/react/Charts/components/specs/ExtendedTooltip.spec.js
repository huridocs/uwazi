import React from 'react';
import { shallow } from 'enzyme';

import ExtendedTooltip from '../ExtendedTooltip';

describe('ExtendedTooltip', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = shallow(<ExtendedTooltip {...props} />);
  };

  it('should render empty when inactive (default)', () => {
    render();
    expect(component.isEmptyRender()).toBe(true);
  });

  it('should render values and labels from both sets if active', () => {
    props.active = true;
    props.payload = [
      { value: 1, payload: { name: 'nameA', setALabel: 'labelA' } },
      { value: 2, payload: { name: 'nameB', setBLabel: 'labelB' } }
    ];

    render();
    expect(component.text()).toBe('nameA:  3labelA:  1labelB:  2');
  });
});
