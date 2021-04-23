import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { Form, Field, Control } from 'react-redux-form';
import { MarkDown } from 'app/ReactReduxForms';
import { PageCreator, PageCreatorProps } from '../PageCreator';

describe('PageCreator', () => {
  let component: ShallowWrapper<PageCreator>;
  let props: PageCreatorProps;

  beforeEach(() => {
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
      },
      formState: { title: {}, $form: { errors: {} } },
      savePage: jasmine.createSpy('savePage'),
      resetPage: jasmine.createSpy('deletePage'),
      savingPage: false,
    };
  });

  const render = () => {
    component = shallow(
      <PageCreator
        page={props.page}
        formState={props.formState}
        savePage={props.savePage}
        resetPage={props.resetPage}
        savingPage={props.savingPage}
      />
    );
  };

  describe('render', () => {
    it('should render the creator form which saves on submit', () => {
      render();
      expect(component.find(Form).props().onSubmit).toBe(props.savePage);
    });

    it('should disable saving while savingPage', () => {
      props.savingPage = true;
      render();
      expect(
        component
          .find('button')
          .first()
          .props().disabled
      ).toBe(true);
    });

    it('should have a title field associated to the page title', () => {
      render();
      expect(
        component
          .find(Field)
          .first()
          .props().model
      ).toBe('.title');
      expect(
        component
          .find(Field)
          .first()
          .parent()
          .props().className
      ).toBe('template-name form-group');
    });

    it('should hold the different input fields', () => {
      render();
      expect(component.find(MarkDown).props().model).toBe('.metadata.content');
      expect(
        component
          .find('textarea')
          .parent()
          .props().model
      ).toBe('.metadata.script');
      expect(component.find(Control).props().model).toBe('.entityView');
    });

    describe('when Title is invalid', () => {
      it('should add the has-error class to the title input', () => {
        props.formState.title.valid = false;
        props.formState.title.touched = true;
        render();
        expect(
          component
            .find(Field)
            .first()
            .parent()
            .props().className
        ).toBe('template-name form-group has-error');
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
