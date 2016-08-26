export function required(val) {
  return !!val && val.trim() !== '';
}

export default {
  generate(template) {
    let validationObject = {
      title: {required}
    };

    template.properties.forEach((property) => {
      if (property.required) {
        validationObject[`metadata.${property.name}`] = {required};
      }
    });

    return validationObject;
  }
};
