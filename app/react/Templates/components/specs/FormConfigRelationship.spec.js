import Immutable from 'immutable';

import FormConfigRelationship from '../FormConfigRelationship';
import { renderConnected } from '../../specs/utils/renderConnected.tsx';

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

  it('should render fields with the correct datas', () => {
    const component = render();
    expect(component).toMatchSnapshot();
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
});
