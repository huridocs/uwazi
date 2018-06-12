import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';

import { Customisation } from '../Customisation';

describe('Customisation', () => {
  let component;
  let loadForm;

  beforeEach(() => {
    loadForm = jasmine.createSpy('loadForm');
    component = shallow(<Customisation settings={Immutable.fromJS({ customCSS: 'custom css' })} loadForm={loadForm} />);
  });

  it('should render Customisation component', () => {
    expect(component).toMatchSnapshot();
  });

  it('should load the form with the settings on component mount', () => {
    const instance = component.instance();

    instance.componentDidMount();
    expect(loadForm).toHaveBeenCalledWith('settings', { customCSS: 'custom css' });
  });
});
