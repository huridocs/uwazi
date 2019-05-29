import { createSelector } from 'reselect';

import formater from './helpers/formater';

const formatMetadata = createSelector(
  s => s.templates,
  s => s.thesauris,
  (s, doc, sortProperty, references) => ({ doc, sortProperty, references }),
  (templates, thesauris, { doc, sortProperty, references }) => {
    if (sortProperty) {
      return formater.prepareMetadataForCard(doc, templates, thesauris, sortProperty).metadata;
    }
    return formater.prepareMetadata(doc, templates, thesauris, references).metadata;
  }
);

export default { formatMetadata };
