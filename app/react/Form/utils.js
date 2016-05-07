import Immutable from 'immutable';
import _validate from 'validate.js';
import dot from 'dot-object';

export function prepareTemplateFields(template, thesauris) {
  let fieldsTemplate = template.properties.map((property) => {
    if (property.type === 'select') {
      property.options = thesauris.find(thesauri => thesauri._id === property.content).values.map((value) => {
        return {label: value.label, value: value.id};
      });
    }
    return property;
  });

  return Immutable.fromJS(template).set('properties', fieldsTemplate).toJS();
}


export function generateValidation(template, prefix = '') {
  return template.properties.reduce((validation, property) => {
    if (property.required) {
      validation[prefix + property.name] = {presence: true};
    }
    return validation;
  }, {});
}

export function validate(values, validations) {
  return dot.object(_validate(values, validations) || {});
}

export function buildDocumentForm() {

}
