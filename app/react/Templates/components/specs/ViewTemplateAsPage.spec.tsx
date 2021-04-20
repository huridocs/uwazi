import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { ViewTemplateAsPage } from '../ViewTemplateAsPage';

describe('ViewTemplateAsPage', () => {
  let component: ShallowWrapper<typeof ViewTemplateAsPage>;

  it('should contain a label with an info icon and a ToggleChildren component', () => {
    component = shallow(<ViewTemplateAsPage />);
    expect(component.find('label')).toHaveLength(1);
    expect(component.find('Tip')).toHaveLength(1);
    expect(component.find('ToggleChildren')).toHaveLength(1);
  });
});
