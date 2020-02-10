import { createSelector } from 'reselect';

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
  (_s, doc, sortProperty, references) => ({ doc, sortProperty, references }),
  (templates, thesauris, { doc, sortProperty, references }) => {
    if (sortProperty) {
      return formater.prepareMetadataForCard(doc, templates, thesauris, sortProperty).metadata;
    }
    return formater.prepareMetadata(doc, templates, thesauris, references).metadata;
  }
);

const metadataSelectors = {
  formatMetadata,
  indexedThesaurus,
};

export { metadataSelectors };
