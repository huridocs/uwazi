import { createSelector } from 'reselect';

import formater from './helpers/formater';

const formatMetadata = createSelector(
  s => s.templates,
  s => s.thesauris,
  (s, doc, sortProperty) => ({ doc, sortProperty }),
  (templates, thesauris, { doc, sortProperty }) => {
    if (sortProperty) {
      return formater.prepareMetadataForCard(doc, templates, thesauris, sortProperty).metadata;
    }
    return formater.prepareMetadata(doc, templates, thesauris).metadata;
  }
);

export default { formatMetadata };
