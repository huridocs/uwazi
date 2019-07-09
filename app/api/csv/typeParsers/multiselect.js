import thesauris from 'api/thesauris';
import { unique, emptyString } from 'api/utils/filters';

const multiselect = async (entityToImport, templateProperty) => {
  const currentThesauri = await thesauris.getById(templateProperty.content);

  const values = entityToImport[templateProperty.name].split('|')
  .map(v => v.trim())
  .filter(emptyString)
  .filter(unique);

  const newValues = values.filter(v =>
    !currentThesauri.values.find(cv => cv.label.trim().toLowerCase() === v.toLowerCase()));

  const lowerCaseValues = values.map(v => v.toLowerCase());
  if (!newValues.length) {
    return currentThesauri.values
    .filter(value => lowerCaseValues.includes(value.label.trim().toLowerCase()))
    .map(value => value.id);
  }

  const updated = await thesauris.save({
    ...currentThesauri,
    values: currentThesauri.values.concat(
      newValues.map(label => ({ label }))
    )
  });

  return updated.values
  .filter(value => lowerCaseValues.includes(value.label.toLowerCase()))
  .map(value => value.id);
};

export default multiselect;
