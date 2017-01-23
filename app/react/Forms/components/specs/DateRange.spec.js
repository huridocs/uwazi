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
      fromChange: jasmine.createSpy('fromChange'),
      toChange: jasmine.createSpy('toChange')
    };
  });

  let render = () => {
    component = shallow(<DateRange {...props}/>);
  };

  it('should render two DatePickerField components passing the correct models', () => {
    render();
    expect(component.find(DatePicker).at(0).props().model).toBe('model.from');
    expect(component.find(DatePicker).at(1).props().model).toBe('model.to');
  });

  describe('when a date is selected', () => {
    it('should triger onChange events', () => {
      render();
      component.find(DatePicker).first().simulate('change', '1469656800');
      expect(props.fromChange).toHaveBeenCalled();
      component.find(DatePicker).last().simulate('change', '1469656800');
      expect(props.toChange).toHaveBeenCalled();
    });
  });
});
