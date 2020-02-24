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
  generate(template, noTitle = false) {
    const validationObject = {
      title: { required: notEmpty },
    };

    if (noTitle) {
      delete validationObject.title;
    }

    template.properties.forEach(property => {
      if (property.required) {
        validationObject[`metadata.${property.name}`] = { required: notEmpty };
      }
    });

    return validationObject;
  },
};
