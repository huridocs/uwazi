function validateTitle() {
  return {
    required: (val) => val && val.trim() !== ''
  };
}

export default function () {
  let validator = {
    '': {},
    title: validateTitle()
  };

  return validator;
}
