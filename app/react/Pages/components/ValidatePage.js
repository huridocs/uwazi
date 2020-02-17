function validateTitle() {
  return {
    required: val => val && val.trim() !== '',
  };
}

export default function() {
  const validator = {
    '': {},
    title: validateTitle(),
  };

  return validator;
}
