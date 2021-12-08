/** @format */

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

export function labelAndUrl(val) {
  return (
    !notEmpty(val) ||
    !notEmpty(val.label) ||
    (notEmpty(val.label) && notEmpty(val.url)) ||
    notEmpty(val.url)
  );
}

export function latAndLon(val) {
  return (
    !notEmpty(val) ||
    (notEmpty(val[0].lat) && notEmpty(val[0].lon)) ||
    (!notEmpty(val[0].lat) && !notEmpty(val[0].lon))
  );
}

const geolocationValidation = property => {
  const validationObject = {};
  if (property.required) {
    validationObject[`metadata.${property.name}[0].lat`] = { required: notEmpty };
    validationObject[`metadata.${property.name}[0].lon`] = { required: notEmpty };
    return validationObject;
  }

  validationObject[`metadata.${property.name}`] = { required: latAndLon };
  return validationObject;
};

const linkValidation = property => {
  const validationObject = {};
  if (property.required) {
    validationObject[`metadata.${property.name}.label`] = { required: notEmpty };
    validationObject[`metadata.${property.name}.url`] = { required: notEmpty };
    return validationObject;
  }

  validationObject[`metadata.${property.name}`] = { required: labelAndUrl };
  return validationObject;
};

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

      if (property.type === 'link') {
        Object.assign(validationObject, linkValidation(property));
      }

      if (property.type === 'geolocation') {
        Object.assign(validationObject, geolocationValidation(property));
      }
    });

    return validationObject;
  },
};
