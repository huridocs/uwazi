export function required(val) {
  if (Array.isArray(val)) {
    return Boolean(val.length);
  }
  if (typeof val === 'number') {
    return true;
  }
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
