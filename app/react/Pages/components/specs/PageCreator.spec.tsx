import React from 'react';
import Immutable from 'immutable';
import { shallow, ShallowWrapper } from 'enzyme';

import { Field, Control } from 'react-redux-form';
import { Form } from 'app/Forms/Form';
import { MarkDown } from 'app/ReactReduxForms';
import { PageCreatorComponent as PageCreator, mappedProps } from '../PageCreator';

describe('PageCreator', () => {
  let component: ShallowWrapper<typeof PageCreator>;
  let props: mappedProps;

  beforeEach(() => {
    const formState = { title: {}, $form: { errors: {} } };
    const uiState = Immutable.fromJS({ savingPage: false });
    props = {
      page: {
        data: {
          _id: '',
          title: 'Page title',
          metadata: {},
          language: 'en',
          sharedId: '',
          entityView: false,
        },
        formState,
        uiState,
      },
      formState,
      savePage: jasmine.createSpy('savePage'),
      resetPage: jasmine.createSpy('deletePage'),
      updateValue: jasmine.createSpy('updateValue'),
      savingPage: false,
      navigate: jasmine.createSpy('navigate'),
    };
  });

  const render = () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    component = shallow(<PageCreator {...props} />);
  };

  describe('render', () => {
    it('should render the creator form which saves on submit', () => {
      render();
      component.find(Form).props().onSubmit!({ name: 'page1' });
      expect(props.savePage).toHaveBeenCalledWith({ name: 'page1' }, props.navigate);
    });

    it('should disable saving while savingPage', () => {
      props.savingPage = true;
      render();
      expect(component.find('button').first().props().disabled).toBe(true);
    });

    it('should have a title field associated to the page title', () => {
      render();
      expect(component.find(Field).first().props().model).toBe('.title');
      expect(component.find(Field).first().parent().props().className).toBe(
        'template-name form-group'
      );
    });

    it('should hold the different input fields', () => {
      render();
      expect(component.find(MarkDown).props().model).toBe('.metadata.content');
      expect(component.find('textarea').parent().props().model).toBe('.metadata.script');
      expect(component.find(Control).props().model).toBe('.entityView');
    });

    describe('when Title is invalid', () => {
      it('should add the has-error class to the title input', () => {
        props.formState.title.valid = false;
        props.formState.title.touched = true;
        render();
        expect(component.find(Field).first().parent().props().className).toBe(
          'template-name form-group has-error'
        );
      });
    });
  });

  describe('on componentWillUnmount', () => {
    beforeEach(() => {
      render();
      component.unmount();
    });

    it('should reset the page', () => {
      expect(props.resetPage).toHaveBeenCalled();
    });
  });
});
