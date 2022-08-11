import Immutable from 'immutable';
import { Select } from 'app/ReactReduxForms';
import { actions as formActions } from 'react-redux-form';
import { renderConnected } from 'app/utils/test/renderConnected';
import FormConfigRelationship from '../FormConfigRelationship';

describe('FormConfigRelationship', () => {
  let templates;
  let relationTypes;
  let props;
  let storeData;

  const render = () => renderConnected(FormConfigRelationship, props, storeData);

  beforeEach(() => {
    templates = [{ _id: 3, name: 'Judge', type: 'template', properties: [] }];
    relationTypes = [
      { _id: 1, name: 'relationType1' },
      { _id: 2, name: 'relationType2' },
    ];

    storeData = {
      templates: Immutable.fromJS(templates),
      relationTypes: Immutable.fromJS(relationTypes),
      template: {
        data: { properties: [{ filter: false }] },
        formState: {
          'properties.0.label': { valid: true, dirty: false, errors: {} },
          properties: [{ content: { value: 3 } }],
          $form: {
            errors: {},
          },
        },
      },
    };

    props = {
      index: 0,
      type: 'relationship',
    };
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      storeData.template.formState.$form.errors['properties.0.label.required'] = true;

      const component = render();
      expect(component).toMatchSnapshot();
    });

    it('should render the label with errors when the form is submited', () => {
      storeData.template.formState.$form.errors['properties.0.label.required'] = true;
      storeData.template.formState.submitFailed = true;

      const component = render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('when use as filter is selected', () => {
    it('should show the default filter option', () => {
      storeData.template.data.properties[0].filter = true;

      const component = render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('when check as inherit', () => {
    beforeEach(() => {
      templates = [
        { _id: 3, name: 'Judge', type: 'template', properties: [{ name: 'text', type: 'text' }] },
      ];
      storeData.templates = Immutable.fromJS(templates);
    });
    it('should render a select with the possible options', () => {
      storeData.template.formState.properties[0].inherit = {
        property: { value: 3 },
      };
      const component = render();
      const selects = component.find(Select);

      const inheritPropSelect = selects.findWhere(select =>
        select.props().model.match('inherit.property')
      );

      expect(inheritPropSelect.length).toBe(1);

      const checkbox = component.find('#inherit0');
      expect(checkbox.props().checked).toBe(true);
    });

    describe('when clicking the inherit checkbox', () => {
      it('should render the select with options', () => {
        const component = render();
        const checkbox = component.find('#inherit0');
        checkbox.simulate('change');

        const selects = component.find(Select);

        const inheritPropSelect = selects.findWhere(select =>
          select.props().model.match('inherit.property')
        );

        expect(inheritPropSelect.length).toBe(1);
      });
    });

    describe('when unselecting the inherit checkbox', () => {
      it('should empty the inherit value', () => {
        spyOn(formActions, 'reset').and.callThrough();
        storeData.template.formState.properties[0].inherit = {
          property: { value: 3 },
        };
        const component = render();
        const checkbox = component.find('#inherit0');
        checkbox.simulate('change');
        expect(formActions.reset).toHaveBeenCalledWith(
          'template.data.properties[0].inherit.property'
        );
        expect(formActions.reset).toHaveBeenCalledWith('template.data.properties[0].filter');
      });
    });
  });
});
