import React from 'react';
import {shallow} from 'enzyme';

import {PageCreator} from '../PageCreator';
import {Form} from 'react-redux-form';
import {FormField} from 'app/Forms';

describe('PageCreator', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      page: {data: {title: 'Page title', metadata: {}}},
      formState: {fields: {title: {}}, errors: {}},
      savePage: jasmine.createSpy('savePage'),
      resetPage: jasmine.createSpy('deletePage')
    };
  });

  let render = () => {
    component = shallow(<PageCreator {...props} />);
  };

  describe('render', () => {
    it('should render the creator form which saves on submit', () => {
      render();
      expect(component.find(Form).props().onSubmit).toBe(props.savePage);
    });

    it('should have a title field associated to the page title', () => {
      render();
      expect(component.find(FormField).first().props().model).toBe('page.data.title');
      expect(component.find(FormField).first().parent().props().className).toBe('template-name form-group');
    });

    describe('when Title is invalid', () => {
      it('should add the has-error class to the title input', () => {
        props.formState.fields.title.valid = false;
        props.formState.fields.title.dirty = true;
        render();
        expect(component.find(FormField).first().parent().props().className).toBe('template-name form-group has-error');
      });
    });
  });

  describe('on componentWillUnmount', () => {
    beforeEach(() => {
      render();
      component.instance().componentWillUnmount();
    });

    it('should reset the page', () => {
      expect(props.resetPage).toHaveBeenCalled();
    });
  });
});
