/** @format */

import thesauris from 'api/thesauris';

const select = async (entityToImport, templateProperty) => {
  const currentThesauri = await thesauris.getById(templateProperty.content);
  if (entityToImport[templateProperty.name].trim() === '') {
    return null;
  }

  const thesauriMatching = v =>
    v.label.trim().toLowerCase() === entityToImport[templateProperty.name].trim().toLowerCase();

  let value = currentThesauri.values.find(thesauriMatching);

  if (!value) {
    const updated = await thesauris.save({
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
