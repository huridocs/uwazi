import React from 'react';
import { shallow } from 'enzyme';

import LinkField from '../LinkField';

describe('LinkField', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      value: { label: 'huridocs', url: 'https://www.huridocs.org/' },
      onChange: jasmine.createSpy('onChange'),
    };
  });

  const render = () => {
    component = shallow(<LinkField {...props} />);
  };

  it('should render 2 inputs with the lat and lon values', () => {
    render();
    const inputs = component.find('input');
    const labelInput = inputs.first();
    const urlInput = inputs.last();
    expect(labelInput.props().value).toBe('huridocs');
    expect(urlInput.props().value).toBe('https://www.huridocs.org/');
  });

  describe('when label changes', () => {
    it('should call onChange with the new value', () => {
      render();
      const inputs = component.find('input');
      const latInput = inputs.first();
      latInput.simulate('change', { target: { value: 'uwazi' } });
      expect(props.onChange).toHaveBeenCalledWith({
        label: 'uwazi',
        url: 'https://www.huridocs.org/',
      });
    });
  });

  describe('when lon changes', () => {
    it('should call onChange with the new value', () => {
      render();
      const inputs = component.find('input');
      const lonInput = inputs.last();
      lonInput.simulate('change', { target: { value: 'https://www.uwazi.org/' } });
      expect(props.onChange).toHaveBeenCalledWith({
        label: 'huridocs',
        url: 'https://www.uwazi.org/',
      });
    });
  });
});
