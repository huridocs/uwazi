/** @format */

import thesauri from 'api/thesauri';

const select = async (entityToImport, templateProperty) => {
  const currentThesauri = await thesauri.getById(templateProperty.content);
  if (entityToImport[templateProperty.name].trim() === '') {
    return null;
  }

  const thesauriMatching = v =>
    v.label.trim().toLowerCase() === entityToImport[templateProperty.name].trim().toLowerCase();

  let value = currentThesauri.values.find(thesauriMatching);

  if (!value) {
    const updated = await thesauri.save({
      ...currentThesauri,
      values: currentThesauri.values.concat([
        {
          label: entityToImport[templateProperty.name],
        },
      ]),
    });
    value = updated.values.find(thesauriMatching);
  }
  return [{ value: value.id, label: value.label }];
};

export default select;
