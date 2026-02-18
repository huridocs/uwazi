import ReactPlayer from 'react-player';

function notEmpty(val) {
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

function labelAndUrl(val) {
  return (
    !notEmpty(val) ||
    !notEmpty(val.label) ||
    (notEmpty(val.label) && notEmpty(val.url)) ||
    notEmpty(val.url)
  );
}

function latAndLon(val) {
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

const validImageFile = file => file.mimetype && file.mimetype.includes('image');

const validMediaFile = file =>
  (file.mimetype && (file.mimetype.includes('video') || file.mimetype.includes('audio'))) ||
  (file.url && ReactPlayer.canPlay(file.url));

export {
  notEmpty,
  labelAndUrl,
  latAndLon,
  geolocationValidation,
  linkValidation,
  validImageFile,
  validMediaFile,
};

const validator = {
  generate(template, _multipleEdition) {
    const validationObject = {
      title: { required: notEmpty },
    };
    (template.properties || []).forEach(property => {
      if (property.required) {
        validationObject[`metadata.${property.name}`] = { required: notEmpty };
      }
    });
    return validationObject;
  },
};

export { validator };
