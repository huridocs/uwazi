import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as immutable} from 'immutable';

import {MetadataFormButtons} from '../MetadataFormButtons';

describe('MetadataFormButtons', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    context = {confirm: jasmine.createSpy('confirm')};
    props = {
      loadInReduxForm: jasmine.createSpy('loadInReduxForm'),
      data: immutable({test: 'test'}),
      data: immutable({test: 'test'}),
      form: 'form'
    };
  });

  let render = () => {
    component = shallow(<MetadataFormButtons {...props} />, {context});
  };

  describe('edit', () => {
    beforeEach(() => {
      render();
    });

    it('should load the entity on the reduxForm', () => {
      component.find('.edit-metadata').simulate('click');
      expect(props.loadInReduxForm).toHaveBeenCalledWith(props.form, props.data.toJS(), props.templates);
    });
  });
});
