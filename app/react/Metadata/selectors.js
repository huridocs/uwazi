import {createSelector} from 'reselect';

import formater from './helpers/formater';

const formatMetadata = createSelector(
  s => s.templates,
  s => s.thesauris,
  (s, d) => d,
  (templates, thesauris, doc) => {
    return formater.prepareMetadata(doc, templates, thesauris).metadata;
  }
);

export { formatMetadata };
