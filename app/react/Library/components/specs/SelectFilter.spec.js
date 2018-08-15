import React from 'react';

import { shallow } from 'enzyme';

import SelectFilter from '../SelectFilter';

describe('SelectFilter', () => {
  it('should render a text filter field with a label and passing the model', () => {
    const props = {
      label: 'label',
      model: 'model',
      options: ['options'],
    };

    const component = shallow(<SelectFilter {...props}/>);
    expect(component).toMatchSnapshot();
  });

  describe('when showBoolSwitch', () => {
    it('should render the and/or bool switch', () => {
      const props = {
        label: 'label',
        model: 'model',
        prefix: 'prefix',
        options: ['options'],
        showBoolSwitch: true
      };

      const component = shallow(<SelectFilter {...props}/>);
      expect(component).toMatchSnapshot();
    });
  });
});
