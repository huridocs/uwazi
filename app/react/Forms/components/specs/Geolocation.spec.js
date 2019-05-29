import React from 'react';
import { shallow } from 'enzyme';

import Geolocation from '../Geolocation';

describe('Geolocation', () => {
  let component;
  let instance;
  let props;

  const render = () => {
    component = shallow(<Geolocation {...props}/>);
    instance = component.instance();
  };

  beforeEach(() => {
    props = {
      value: [
        { lat: 32.18, lon: -17.2, label: 'home' },
        { lat: 13.07, lon: 5.10, label: 'Created through migration?' },
      ],
      onChange: jasmine.createSpy('onChange')
    };

    render();
  });

  it('should render 2 inputs with the lat and lon values, and optional label', () => {
    const inputs = component.find('input');
    const latInput = inputs.at(0);
    const lonInput = inputs.at(1);

    expect(latInput.props().value).toBe(32.18);
    expect(lonInput.props().value).toBe(-17.2);
  });

  describe('when lat changes', () => {
    it('should call onChange with the new value', () => {
      const latInput = component.find('input').at(0);
      latInput.simulate('change', { target: { value: '19' } });
      expect(props.onChange).toHaveBeenCalledWith([{ lat: 19, lon: -17.2, label: 'home' }, props.value[1]]);
    });
  });

  describe('when lon changes', () => {
    it('should call onChange with the new value', () => {
      const lonInput = component.find('input').at(1);
      lonInput.simulate('change', { target: { value: '28' } });
      expect(props.onChange).toHaveBeenCalledWith([{ lat: 32.18, lon: 28, label: 'home' }, props.value[1]]);
    });
  });

  describe('mapClick', () => {
    it('should call onChange with the map value', () => {
      const event = { lngLat: [5, 13] };
      instance.mapClick(event);
      expect(props.onChange).toHaveBeenCalledWith([{ lat: 13, lon: 5, label: 'home' }, props.value[1]]);
    });

    it('should work assign default values if original point was null', () => {
      props.value = [null];
      render();
      instance.mapClick({ lngLat: [13, 7] });
      expect(props.onChange).toHaveBeenCalledWith([{ lat: 7, lon: 13, label: '' }]);
    });
  });

  describe('empty lat/lon values', () => {
    function testInputWillTriggerOnChangeWithoutValue(getInput) {
      const inputs = component.find('input');
      const input = getInput(inputs);
      input.simulate('change', { target: { value: '' } });
      expect(props.onChange.calls.argsFor(0)).toEqual([]);
    }

    describe('if lon is empty and lat is set to empty', () => {
      it('should call onChange without a value', () => {
        props.value[0].lon = '';
        testInputWillTriggerOnChangeWithoutValue(inputs => inputs.at(0));
      });
    });

    describe('if lat is empty and lon is set to empty', () => {
      it('should call onChange without a value', () => {
        props.value[0].lat = '';
        testInputWillTriggerOnChangeWithoutValue(inputs => inputs.at(1));
      });
    });
  });

  it('should render button to clear fields', () => {
    expect(component).toMatchSnapshot();
  });

  it('should hide clear fields button when lat and lon are empty', () => {
    props.value = [{ lat: '', lon: '' }];
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when clear fields button is clicked', () => {
    it('should call onChange without a value', () => {
      const button = component.find('.clear-field-button button').first();
      button.simulate('click');
      expect(props.onChange.calls.argsFor(0)).toEqual([]);
    });
  });
});
