import React from 'react';
import { shallow } from 'enzyme';

import Geolocation from '../Geolocation';

describe('Geolocation', () => {
  let component;
  let instance;
  let props;

  const render = () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    component = shallow(<Geolocation {...props} />);
    instance = component.instance();
  };

  beforeEach(() => {
    props = {
      value: [
        { lat: 32.18, lon: -17.2, label: 'home' },
        { lat: 13.07, lon: 5.1, label: 'Created through migration?' },
      ],
      onChange: jasmine.createSpy('onChange'),
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
    function expectOnChangeCallWhenInputSimulation(simulatedInput, expectedValue) {
      const latInput = component.find('input').at(0);
      latInput.simulate('change', { target: { value: simulatedInput } });
      expect(props.onChange).toHaveBeenCalledWith([
        { lat: expectedValue, lon: -17.2, label: 'home' },
        props.value[1],
      ]);
    }

    it('should call onChange with the new value', () => {
      expectOnChangeCallWhenInputSimulation('0', 0);
      expectOnChangeCallWhenInputSimulation('1', 1);
      expectOnChangeCallWhenInputSimulation('19', 19);
    });

    it('with an angle lower than -89.99999 degrees the value should be replace by -89.99999 degrees', () => {
      expectOnChangeCallWhenInputSimulation('-91', -89.99999);
      expectOnChangeCallWhenInputSimulation('-120.34', -89.99999);
      expectOnChangeCallWhenInputSimulation('-90', -89.99999);
      expectOnChangeCallWhenInputSimulation('-89.999991', -89.99999);
    });

    it('with an angle greater than 90 degrees the value should be replace by 90 degrees', () => {
      expectOnChangeCallWhenInputSimulation('91', 90);
      expectOnChangeCallWhenInputSimulation('120.34', 90);
    });
  });

  describe('when lon changes', () => {
    let lonInput;

    beforeEach(() => {
      lonInput = component.find('input').at(1);
    });

    it('should call onChange with the new value', () => {
      lonInput.simulate('change', { target: { value: '28' } });
      expect(props.onChange).toHaveBeenCalledWith([
        { lat: 32.18, lon: 28, label: 'home' },
        props.value[1],
      ]);
    });
  });

  describe('mapClick', () => {
    it('should call onChange with the map value', () => {
      const event = { lngLat: [5, 13] };
      instance.mapClick(event);
      expect(props.onChange).toHaveBeenCalledWith([
        { lat: 13, lon: 5, label: 'home' },
        props.value[1],
      ]);
      expect(component.find('input').at(0).props().value).toEqual(13);
      expect(component.find('input').at(1).props().value).toEqual(5);
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
      expect(props.onChange).toHaveBeenCalledWith([]);
    }

    it('should return an empty value', () => {
      props.value[0].lon = '';
      props.value[0].lat = '';
      render();
      testInputWillTriggerOnChangeWithoutValue(inputs => inputs.at(0));
    });

    describe('when they are no empty anymore', () => {
      it('should call onChange with the correct values', () => {
        component
          .find('input')
          .at(0)
          .simulate('change', { target: { value: '' } });
        component
          .find('input')
          .at(1)
          .simulate('change', { target: { value: '' } });

        component
          .find('input')
          .at(0)
          .simulate('change', { target: { value: '1' } });
        component
          .find('input')
          .at(1)
          .simulate('change', { target: { value: '2' } });

        expect(props.onChange).toHaveBeenCalledWith([
          { lat: 1, lon: 2, label: 'home' },
          { label: 'Created through migration?', lat: 13.07, lon: 5.1 },
        ]);
      });
    });
  });

  describe('should render button to clear fields', () => {
    function expectRenderButton(latitude, longitude) {
      component
        .find('input')
        .at(0)
        .simulate('change', { target: { value: latitude } });
      component
        .find('input')
        .at(1)
        .simulate('change', { target: { value: longitude } });
      expect(component.exists('.clear-field-button')).toEqual(true);
    }

    it('when latitude empty and longitude not empty', () => {
      expectRenderButton('', '1');
    });

    it('when longitude empty and latitude not empty', () => {
      expectRenderButton('1', '');
    });
  });

  describe('when latitude and longitude are empty', () => {
    it('should hide clear fields button', () => {
      props.value = [{ lat: '', lon: '' }];
      render();
      expect(component.find('button').length).toBe(0);
    });
  });

  describe('when clear fields button is clicked', () => {
    beforeEach(() => {
      const button = component.find('.clear-field-button button').first();
      button.simulate('click');
    });

    it('should call onChange without a value and remove the inputs values', () => {
      expect(props.onChange).toHaveBeenCalledWith([]);
    });

    it('should remove the inputs values', () => {
      expect(component.find('input').at(0).props().value).toEqual('');
      expect(component.find('input').at(1).props().value).toEqual('');
    });
  });
});
