export function validateProperty(property) {
  let errors = {};
  if (!property.label) {
    errors.label = 'Required';
  }

  let isSelect = property.type === 'list' || property.type === 'select';
  if (isSelect && !property.content) {
    errors.content = 'Required';
  }

  return errors;
}

export function validateName(values) {
  let errors = {};

  if (!values.name) {
    errors.name = 'Required';
  }

  return errors;
}

export default function validate(values) {
  let errors = validateName(values);

  errors.properties = [];
  values.properties.forEach((property, index) => {
    errors.properties[index] = validateProperty(property);
  });

  return errors;
}
