import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { DropdownListbox } from '#V2/Components/UI/DropdownListbox.js';
import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { sortOptionLabel } from '../utils/relationshipsPanelLabels.js';
import { useRelationshipsPanelSort } from '#V2/Routes/Entity/Components/context/index.js';

const sortOptionIds: RelationshipsPanelSort[] = ['none', 'appearance', 'asc', 'desc'];

const RelationshipsSortControl = () => {
  const { sort: sortOrder, setSort: setSortOrder } = useRelationshipsPanelSort();

  return (
    <DropdownListbox
      prefix={<Translate>Sort:</Translate>}
      value={sortOrder}
      onChange={setSortOrder}
      listAriaLabel={t('System', 'Sort order', null, false)}
      options={sortOptionIds.map(id => ({
        id,
        label: sortOptionLabel(id),
      }))}
    />
  );
};

export { RelationshipsSortControl };
