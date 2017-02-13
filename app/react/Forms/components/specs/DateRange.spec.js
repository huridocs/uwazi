import React from 'react';
import {shallow} from 'enzyme';

import DateRange from '../DateRange';
import DatePicker from '../DatePicker';

describe('DateRange', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      model: 'model',
      onChange: jasmine.createSpy('onChange'),
      value: {from: 0, to: 1}
    };
  });

  let render = () => {
    component = shallow(<DateRange {...props}/>);
  };

  describe('when a date is selected', () => {
    it('should triger onChange events', () => {
      render();
      component.find(DatePicker).first().simulate('change', 1469656800);
      expect(props.onChange).toHaveBeenCalledWith({from: 1469656800, to: 1});
      component.find(DatePicker).last().simulate('change', 1469656800);
      expect(props.onChange).toHaveBeenCalledWith({from: 1469656800, to: 1469656800});
    });
  });
});
