export function notEmpty(val) {
  if (Array.isArray(val)) {
    return Boolean(val.length);
  }
  if (typeof val === 'number') {
    return true;
  }

  if (typeof val === 'object' && val !== null) {
    return Boolean(Object.keys(val).length);
  }
  return !!val && val.trim() !== '';
}

export default {
  generate(template) {
    const validationObject = {
      title: { required: notEmpty }
    };

    template.properties.forEach((property) => {
      if (property.required) {
        validationObject[`metadata.${property.name}`] = { required: notEmpty };
      }
    });

    return validationObject;
  }
};
