import React from 'react';

import { shallow } from 'enzyme';

import SelectFilter from '../SelectFilter';

describe('SelectFilter', () => {
  let props;

  beforeEach(() => {
    props = {
      label: 'label',
      model: 'model',
      options: ['options'],
    };
  });

  it('should render a text filter field with a label and passing the model', () => {
    const component = shallow(<SelectFilter {...props} />);
    expect(component).toMatchSnapshot();
  });

  describe('when showBoolSwitch', () => {
    it('should render the and/or bool switch', () => {
      props = {
        label: 'label',
        model: 'model',
        prefix: 'prefix',
        options: ['options'],
        showBoolSwitch: true,
      };

      const component = shallow(<SelectFilter {...props} />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when sort prop is set to true', () => {
    it('should activate sorting in the MultiSelect', () => {
      props.sort = true;
      const component = shallow(<SelectFilter {...props} />);
      expect(component).toMatchSnapshot();
    });
  });
});
