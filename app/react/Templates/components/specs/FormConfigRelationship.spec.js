import Immutable from 'immutable';
import React from 'react';

import { FormConfigRelationship } from 'app/Templates/components/FormConfigRelationship';
import { shallow } from 'enzyme';

describe('FormConfigRelationship', () => {
  let component;
  let thesauris;
  let relationTypes;
  let props;

  beforeEach(() => {
    thesauris = [{ _id: 1, name: 'thesauri1' }, { _id: 2, name: 'thesauri2' }, { _id: 3, name: 'Judge', type: 'template' }];
    relationTypes = [{ _id: 1, name: 'relationType1' }, { _id: 2, name: 'relationType2' }];
    props = {
      thesauris: Immutable.fromJS(thesauris),
      relationTypes: Immutable.fromJS(relationTypes),
      index: 0,
      data: { properties: [{ filter: false }] },
      formState: {
        'properties.0.label': { valid: true, dirty: false, errors: {} },
        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false
          }
        }
      }
    };
  });

  it('should render fields with the correct datas', () => {
    component = shallow(<FormConfigRelationship {...props}/>);
    expect(component).toMatchSnapshot();
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState['properties.0.label'].touched = true;
      component = shallow(<FormConfigRelationship {...props}/>);
      expect(component).toMatchSnapshot();
    });

    it('should render the label with errors when the form is submited', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = shallow(<FormConfigRelationship {...props}/>);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when use as filter is selected', () => {
    it('should show the default filter option', () => {
      props.data.properties[0].filter = true;
      component = shallow(<FormConfigRelationship {...props}/>);
      expect(component).toMatchSnapshot();
    });
  });
});
