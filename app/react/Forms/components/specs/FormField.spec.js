import React from 'react';
import {shallow} from 'enzyme';

import FormField, {FieldController} from '../FormField';

describe('FormField', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  let render = (model = '') => {
    component = shallow(<FormField model={model} {...props}><input /></FormField>);
  };

  describe('when passing a model', () => {
    it('should render the field inside a FieldController with model passed', () => {
      render('model');
      let field = component.find('input').parents(FieldController);
      expect(field.props().model).toBe('model');
    });
  });
});
