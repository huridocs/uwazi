import entities from 'api/entities';
import thesauris from 'api/thesauris';
import { unique, emptyString } from 'api/utils/filters';
import url from 'url';

export default {
  async default(entityToImport, templateProperty) {
    return this.text(entityToImport, templateProperty);
  },

  async text(entityToImport, templateProperty) {
    return entityToImport[templateProperty.name];
  },

  async date(entityToImport, templateProperty) {
    return new Date(`${entityToImport[templateProperty.name]} UTC`).getTime() / 1000;
  },

  async link(entityToImport, templateProperty) {
    let [label, linkUrl] = entityToImport[templateProperty.name].split('|');

    if (!linkUrl) {
      linkUrl = entityToImport[templateProperty.name];
      label = linkUrl;
    }

    if (!url.parse(linkUrl).host) {
      return null;
    }

    return {
      label,
      url: linkUrl,
    };
  },

  async relationship(entityToImport, templateProperty) {
    const values = entityToImport[templateProperty.name].split('|')
    .map(v => v.trim())
    .filter(emptyString)
    .filter(unique);

    const current = await entities.get({ title: { $in: values.map(v => new RegExp(`\\s?${v}\\s?`, 'i')) } });
    const newValues = values.filter(v => !current.map(c => c.title.trim()).includes(v));

    await newValues.reduce(
      async (promise, title) => {
        await promise;
        return entities.save({
          title,
          template: templateProperty.content,
        },
          {
            language: 'en',
            user: {}
          }
        );
      },
      Promise.resolve([])
    );

    const toRelateEntities = await entities.get({ title: { $in: values.map(v => new RegExp(`\\s?${v}\\s?`, 'i')) } });
    return toRelateEntities.map(e => e.sharedId);
  },

  async multiselect(entityToImport, templateProperty) {
    const currentThesauri = await thesauris.getById(templateProperty.content);

    const values = entityToImport[templateProperty.name].split('|')
    .map(v => v.trim())
    .filter(emptyString)
    .filter(unique);

    const newValues = values.filter(v =>
      !currentThesauri.values.find(cv => cv.label.trim() === v));

    if (!newValues.length) {
      return currentThesauri.values
      .filter(value => values.includes(value.label.trim()))
      .map(value => value.id);
    }

    const updated = await thesauris.save({
      ...currentThesauri,
      values: currentThesauri.values.concat(
        newValues.map(label => ({ label }))
      )
    });

    return updated.values
    .filter(value => values.includes(value.label))
    .map(value => value.id);
  },

  async select(entityToImport, templateProperty) {
    const currentThesauri = await thesauris.getById(templateProperty.content);
    if (entityToImport[templateProperty.name].trim() === '') {
      return null;
    }

    const thesauriMatching =
      v => v.label.trim() === entityToImport[templateProperty.name].trim();

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
  },
};
