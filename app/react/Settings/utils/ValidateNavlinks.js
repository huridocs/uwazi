export default function (links) {
  let validator = {
    '': {}
  };

  links.forEach((link, index) => {
    validator[''][`links.${index}.title.required`] = (form) => {
      if (!form.links[index]) {
        return true;
      }
      let title = form.links[index].title;
      return Boolean(title && String(title).trim().length);
    };
  });

  return validator;
}
