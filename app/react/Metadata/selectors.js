import { createSelector } from 'reselect';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';

import Immutable from 'immutable';
import formater from './helpers/formater';

const indexValues = t =>
  t.set(
    'values',
    t.get('values').reduce((indexed, value) => {
      if (value.get('values')) {
        return indexed.merge(indexValues(value).get('values'));
      }
      return indexed.set(value.get('id'), value);
    }, new Immutable.Map({}))
  );

const indexedThesaurus = createSelector(
  s => s.thesauris,
  thesaurus => thesaurus.map(t => indexValues(t))
);

const formatMetadata = createSelector(
  s => s.templates,
  indexedThesaurus,
  s => s.settings,
  (_s, doc, sortProperty, references, options) => ({ doc, sortProperty, references, options }),
  (templates, thesauris, settings, { doc, sortProperty, references, options }) => {
    const defaultDoc = entityDefaultDocument(
      doc.documents,
      doc.language,
      settings
        .get('languages')
        .find(l => l.get('default'))
        .get('key')
    );

    if (sortProperty) {
      return formater.prepareMetadataForCard(
        Object.assign(doc, { defaultDoc }),
        templates,
        thesauris,
        sortProperty
      ).metadata;
    }

    return formater.prepareMetadata(
      Object.assign(doc, { defaultDoc }),
      templates,
      thesauris,
      references,
      options
    ).metadata;
  }
);

const metadataSelectors = {
  formatMetadata,
  indexedThesaurus,
};

export { metadataSelectors };
