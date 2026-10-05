import { createSelector } from 'reselect';

import Immutable from 'immutable';
import { formater } from './helpers/formater.js';

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
  (_s, ...selection) => {
    const [doc, sortProperty, references, options] = selection;
    return { doc, sortProperty, references, options };
  },
  (templates, thesauris, { doc, sortProperty, references, options }) => {
    if (sortProperty) {
      return formater.prepareMetadataForCard(doc, templates, {
        thesauri: thesauris,
        sortedProperty: sortProperty,
      }).metadata;
    }

    return formater.prepareMetadata(doc, templates, {
      thesauri: thesauris,
      relationships: references,
      options,
    }).metadata;
  }
);

const metadataSelectors = {
  formatMetadata,
  indexedThesaurus,
};

export { metadataSelectors };
