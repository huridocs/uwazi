import Immutable from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import { FormConfigRelationship } from '../FormConfigRelationship';

describe('FormConfigRelationship', () => {
  let component;
  let templates;
  let relationTypes;
  let props;

  beforeEach(() => {
    templates = [{ _id: 3, name: 'Judge', type: 'template', properties: [] }];
    relationTypes = [
      { _id: 1, name: 'relationType1' },
      { _id: 2, name: 'relationType2' },
    ];
    props = {
      templates: Immutable.fromJS(templates),
      relationTypes: Immutable.fromJS(relationTypes),
      index: 0,
      type: 'relationship',
      data: { properties: [{ filter: false }] },
      formState: {
        'properties.0.label': { valid: true, dirty: false, errors: {} },
        properties: [{ content: { value: 3 } }],
        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false,
          },
        },
      },
    };
  });

  it('should render fields with the correct datas', () => {
    component = shallow(<FormConfigRelationship {...props} />);
    expect(component).toMatchSnapshot();
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState['properties.0.label'].touched = true;
      component = shallow(<FormConfigRelationship {...props} />);
      expect(component).toMatchSnapshot();
    });

    it('should render the label with errors when the form is submited', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = shallow(<FormConfigRelationship {...props} />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when use as filter is selected', () => {
    it('should show the default filter option', () => {
      props.data.properties[0].filter = true;
      component = shallow(<FormConfigRelationship {...props} />);
      expect(component).toMatchSnapshot();
    });
  });
});
