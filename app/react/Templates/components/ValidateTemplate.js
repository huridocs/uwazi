export function validateName() {
  return {
    required: (val) => val && val.trim() !== ''
  };
}

export function validateProperty(property, index, properties) {
  let validator = {};
  validator[`properties.${index}.label`] = {
    required: (val) => val && val.trim() !== '',
    duplicated: (val) => {
      return properties.reduce((validity, prop) => {
        let differentLabel = prop.localID === this.props.formKey || prop.label !== val;
        return validity && differentLabel;
      }, true);
    }
  };
  return validator;
}

export default function validate(properties) {
  let validator = {
    name: validateName()
  };

  properties.forEach((property, index) => {
    validator = Object.assign(validator, validateProperty(property, index, properties));
  });

  console.log(validator);
  return validator;
}
