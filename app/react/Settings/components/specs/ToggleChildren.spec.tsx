import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ToggleChildren } from '../ToggleChildren';
import { debug } from 'console';

describe('Toggle children', () => {
  const component: ShallowWrapper<typeof ToggleChildren> = shallow(
    <ToggleChildren toggled={false} />
  );
  const children = <p>Contents</p>;

  it('should not display children if not toggled', () => {});

  it('should display nothing if children are not passed', () => {});

  it('should display children if toggled', () => {});
});
