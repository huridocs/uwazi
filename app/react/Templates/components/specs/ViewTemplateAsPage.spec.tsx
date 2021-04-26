import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import Immutable from 'immutable';

import { ViewTemplateAsPage } from '../ViewTemplateAsPage';
import { IStore } from 'app/istore';

describe('ViewTemplateAsPage', () => {
  let component: ShallowWrapper<typeof ViewTemplateAsPage>;
  let state: IStore;

  beforeEach(() => {
    state = {
      pages: Immutable.fromJS({}),
    };
  });

  it('should contain a label with a tip and a toggled pages that can be used', () => {
    component = shallow(<ViewTemplateAsPage />);
    expect(component.find('label')).toHaveLength(1);
    expect(component.find('Tip')).toHaveLength(1);
    expect(component.find('ToggleChildren')).toHaveLength(1);
  });
});
