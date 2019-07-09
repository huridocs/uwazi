import thesauris from 'api/thesauris';

const select = async (entityToImport, templateProperty) => {
  const currentThesauri = await thesauris.getById(templateProperty.content);
  if (entityToImport[templateProperty.name].trim() === '') {
    return null;
  }

  const thesauriMatching =
    v => v.label.trim().toLowerCase() === entityToImport[templateProperty.name].trim().toLowerCase();

  const value = currentThesauri.values.find(thesauriMatching);

  if (value) {
    return value.id;
  }

  const updated = await thesauris.save({
    ...currentThesauri,
    values: currentThesauri.values.concat([{
      label: entityToImport[templateProperty.name]
    }])
  });

  return updated.values.find(thesauriMatching).id;
};

export default select;
