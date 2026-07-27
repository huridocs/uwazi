import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { DisplayMenu, DisplayMenuRow } from '#V2/Components/UI/DisplayMenu.js';
import { WarmSelect } from '#V2/Components/UI/WarmSelect.js';
import {
  groupingOptions,
  type RelationshipsPanelGroupBy,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import {
  DEFAULT_RELATIONSHIPS_GROUP_BY,
  DEFAULT_RELATIONSHIPS_SORT,
  DEFAULT_RELATIONSHIPS_SUB_GROUP_BY,
  DEFAULT_RELATIONSHIPS_ZOOM,
  useRelationshipsPanelLayout,
  useRelationshipsPanelSort,
} from '#V2/Routes/Entity/Components/context/index.js';
import { RelationshipsZoomControl } from './RelationshipsZoomControl.js';
import { groupingOptionLabel, sortOptionLabel } from '../utils/relationshipsPanelLabels.js';

const sortOptionIds: RelationshipsPanelSort[] = ['appearance', 'asc', 'desc', 'none'];

const groupOptions = (exclude: RelationshipsPanelGroupBy) =>
  groupingOptions
    .filter(option => option.id === 'none' || option.id !== exclude)
    .map(option => ({
      value: option.id,
      label: groupingOptionLabel(option.id),
    }));

const RelationshipsDisplayMenu = () => {
  const { view, groupBy, subGroupBy, zoom, setGroupBy, setSubGroupBy } =
    useRelationshipsPanelLayout();
  const { sort, setSort } = useRelationshipsPanelSort();

  const isGraph = view === 'graph';
  const showThenBy = groupBy !== 'none' && !isGraph;
  const showDensity = !isGraph;

  const modified =
    groupBy !== DEFAULT_RELATIONSHIPS_GROUP_BY ||
    (showThenBy && subGroupBy !== DEFAULT_RELATIONSHIPS_SUB_GROUP_BY) ||
    sort !== DEFAULT_RELATIONSHIPS_SORT ||
    (showDensity && zoom !== DEFAULT_RELATIONSHIPS_ZOOM);

  return (
    <DisplayMenu ariaLabel={t('System', 'Display options', null, false)} modified={modified}>
      <DisplayMenuRow label={<Translate>Group by</Translate>}>
        <WarmSelect
          value={groupBy}
          onChange={setGroupBy}
          ariaLabel={t('System', 'Group by', null, false)}
          align="end"
          options={groupOptions(subGroupBy)}
        />
      </DisplayMenuRow>

      {showThenBy && (
        <DisplayMenuRow label={<Translate>Then by</Translate>}>
          <WarmSelect
            value={subGroupBy}
            onChange={setSubGroupBy}
            ariaLabel={t('System', 'Then by', null, false)}
            align="end"
            options={groupOptions(groupBy)}
          />
        </DisplayMenuRow>
      )}

      <DisplayMenuRow label={<Translate>Sort</Translate>}>
        <WarmSelect
          value={sort}
          onChange={setSort}
          ariaLabel={t('System', 'Sort', null, false)}
          align="end"
          options={sortOptionIds.map(id => ({
            value: id,
            label: sortOptionLabel(id),
          }))}
        />
      </DisplayMenuRow>

      {showDensity && (
        <DisplayMenuRow label={<Translate>Density</Translate>}>
          <RelationshipsZoomControl />
        </DisplayMenuRow>
      )}
    </DisplayMenu>
  );
};

export { RelationshipsDisplayMenu };
