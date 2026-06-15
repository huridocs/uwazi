import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import type { RelationshipsPanelGroupBy } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';

const groupingOptionLabels: Record<RelationshipsPanelGroupBy, string> = {
  none: 'None',
  'target-template': 'Target template',
  'target-entity': 'Target entity',
  'source-template': 'Source template',
  'source-entity': 'Source entity',
  'relation-type': 'Relation type',
  direction: 'Direction',
  'source-page': 'Source page',
};

const sortOptionLabels: Record<RelationshipsPanelSort, string> = {
  none: 'None',
  appearance: 'Appearance',
  asc: 'A → Z',
  desc: 'Z → A',
};

export { groupingOptionLabels, sortOptionLabels };
