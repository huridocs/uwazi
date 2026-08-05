import { t } from '#app/I18N/index.js';
import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import type { RelationshipsPanelGroupBy } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';

const groupingOptionLabel = (id: RelationshipsPanelGroupBy): string => {
  switch (id) {
    case 'none':
      return t('System', 'None', null, false);
    case 'target-template':
      return t('System', 'Target template', null, false);
    case 'target-entity':
      return t('System', 'Target entity', null, false);
    case 'source-template':
      return t('System', 'Source template', null, false);
    case 'source-entity':
      return t('System', 'Source entity', null, false);
    case 'relation-type':
      return t('System', 'Relation type', null, false);
    case 'direction':
      return t('System', 'Direction', null, false);
    case 'source-page':
      return t('System', 'Source page', null, false);
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
};

const sortOptionLabel = (id: RelationshipsPanelSort): string => {
  switch (id) {
    case 'none':
      return t('System', 'None', null, false);
    case 'appearance':
      return t('System', 'Appearance', null, false);
    case 'asc':
      return t('System', 'A → Z', null, false);
    case 'desc':
      return t('System', 'Z → A', null, false);
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
};

export { groupingOptionLabel, sortOptionLabel };
