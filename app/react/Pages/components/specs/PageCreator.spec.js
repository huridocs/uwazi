import React from 'react';
import {shallow} from 'enzyme';

import {PageCreator} from '../PageCreator';
import {Form, Field} from 'react-redux-form';

describe('PageCreator', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      page: {data: {title: 'Page title', metadata: {}}},
      formState: {title: {}, $form: {errors: {}}},
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

    it('should disable saving while savingPage', () => {
      props.savingPage = true;
      render();
      expect(component.find('button').first().props().disabled).toBe(true);
    });

    it('should have a title field associated to the page title', () => {
      render();
      expect(component.find(Field).first().props().model).toBe('.title');
      expect(component.find(Field).first().parent().props().className).toBe('template-name form-group');
    });

    describe('when Title is invalid', () => {
      it('should add the has-error class to the title input', () => {
        props.formState.title.valid = false;
        props.formState.title.touched = true;
        render();
        expect(component.find(Field).first().parent().props().className).toBe('template-name form-group has-error');
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
