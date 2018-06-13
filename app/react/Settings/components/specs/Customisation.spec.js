import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';

import { Customisation } from '../Customisation';

describe('Customisation', () => {
  let component;
  let loadForm;
  let saveSettings;

  beforeEach(() => {
    loadForm = jasmine.createSpy('loadForm');
    saveSettings = jasmine.createSpy('saveSettings');
    component = shallow(
      <Customisation
        settings={Immutable.fromJS({ customCSS: 'custom', customSetting: 'anything' })}
        loadForm={loadForm}
        saveSettings={saveSettings}
      />
    );
  });

  it('should render Customisation component', () => {
    expect(component).toMatchSnapshot();
  });

  it('should load the form with the settings on component mount', () => {
    const instance = component.instance();

    instance.componentDidMount();
    expect(loadForm).toHaveBeenCalledWith('settings.settings', { customCSS: 'custom' });
  });
});
