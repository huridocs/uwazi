import React from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';
import { type RelationshipPanelRowHandlers } from '../rows/RelationshipPanelRow.js';
import { RelationshipsGroupedSections } from './RelationshipsGroupedSections.js';
import { RelationshipsPanelEntryList } from './RelationshipsPanelEntryList.js';

type RelationshipsMarkerListBodyProps = RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  variant: 'list' | 'tree';
};

const RelationshipsMarkerListBody = ({
  markers,
  groupContext,
  variant,
  ...rowProps
}: RelationshipsMarkerListBodyProps) => {
  const { groupBy, subGroupBy } = useRelationshipsPanelLayout();

  if (groupBy === 'none') {
    return (
      <RelationshipsPanelEntryList
        bordered={variant === 'list'}
        variant={variant}
        markers={markers}
        groupContext={groupContext}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rowProps}
      />
    );
  }

  const grouped = (
    <RelationshipsGroupedSections
      markers={markers}
      groupContext={groupContext}
      groupBy={groupBy}
      subGroupBy={subGroupBy}
      variant={variant}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rowProps}
    />
  );

  return variant === 'tree' ? <div className="py-3">{grouped}</div> : grouped;
};

export { RelationshipsMarkerListBody };
