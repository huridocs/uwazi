/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  getGroupColor,
  groupMarkers,
  type GroupLabelContext,
  type RelationshipsPanelGroupBy,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipGroupedCard } from '../rows/RelationshipGroupedCard.js';
import { RelationshipsGroupLabel } from '../rows/RelationshipsGroupLabel.js';
import {
  panelEntryCount,
  renderPanelEntryRows,
  RelationshipsPanelEntryList,
} from '../panel/RelationshipsPanelEntryList.js';
import { type RelationshipPanelRowHandlers } from '../rows/RelationshipPanelRow.js';
import { RelationshipsTreeBranch } from '../views/RelationshipsTreeBranch.js';

type RelationshipsGroupedSectionsProps = RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  groupBy: RelationshipsPanelGroupBy;
  subGroupBy: RelationshipsPanelGroupBy;
  variant: 'list' | 'tree';
};

const renderGroupLabel = (
  groupKey: string,
  groupBy: RelationshipsPanelGroupBy,
  groupContext: GroupLabelContext,
  groupMarkersList: RelationshipMarker[]
) => (
  <RelationshipsGroupLabel
    groupKey={groupKey}
    groupBy={groupBy}
    groupContext={groupContext}
    markers={groupMarkersList}
  />
);

const renderPanelEntries = (
  markersList: RelationshipMarker[],
  groupContext: GroupLabelContext,
  variant: 'list' | 'tree',
  rowProps: RelationshipPanelRowHandlers
) => {
  if (variant === 'tree') {
    return renderPanelEntryRows({
      markers: markersList,
      groupContext,
      variant,
      ...rowProps,
    });
  }

  return (
    <RelationshipsPanelEntryList
      markers={markersList}
      groupContext={groupContext}
      variant={variant}
      {...rowProps}
    />
  );
};

type SubGroupRenderParams = {
  parentKey: string;
  groupMarkersList: RelationshipMarker[];
  subGroupBy: RelationshipsPanelGroupBy;
  groupContext: GroupLabelContext;
  rowProps: RelationshipPanelRowHandlers;
  variant: 'list' | 'tree';
};

const renderSubGroups = ({
  parentKey,
  groupMarkersList,
  subGroupBy,
  groupContext,
  rowProps,
  variant,
}: SubGroupRenderParams) => {
  const subGroups = groupMarkers(groupMarkersList, subGroupBy, groupContext).map(
    ([subKey, subMarkers]) => {
      const title = renderGroupLabel(subKey, subGroupBy, groupContext, subMarkers);
      const color = getGroupColor(subKey, subGroupBy, groupContext, subMarkers);
      const count = panelEntryCount(subMarkers, rowProps.selfSharedId);
      const markerIds = subMarkers.map(marker => marker._id);
      const entries = renderPanelEntries(subMarkers, groupContext, variant, rowProps);

      if (variant === 'list') {
        return (
          <RelationshipGroupedCard
            key={`${parentKey}::${subKey}`}
            title={title}
            color={color}
            count={count}
            markerIds={markerIds}
          >
            {entries}
          </RelationshipGroupedCard>
        );
      }

      return (
        <RelationshipsTreeBranch
          key={`${parentKey}::${subKey}`}
          title={title}
          color={color}
          count={count}
          markerIds={markerIds}
        >
          {entries}
        </RelationshipsTreeBranch>
      );
    }
  );

  if (variant === 'list') {
    return <div className="space-y-1.5 bg-warm/30 px-2 py-2">{subGroups}</div>;
  }

  return subGroups;
};

const RelationshipsGroupedSections = ({
  markers,
  groupContext,
  groupBy,
  subGroupBy,
  variant,
  ...rowProps
}: RelationshipsGroupedSectionsProps) => {
  const primaryGroups = groupMarkers(markers, groupBy, groupContext);

  const sections = primaryGroups.map(([key, groupMarkersList]) => {
    const title = renderGroupLabel(key, groupBy, groupContext, groupMarkersList);
    const color = getGroupColor(key, groupBy, groupContext, groupMarkersList);
    const count = panelEntryCount(groupMarkersList, rowProps.selfSharedId);
    const markerIds = groupMarkersList.map(marker => marker._id);
    const content =
      subGroupBy === 'none'
        ? renderPanelEntries(groupMarkersList, groupContext, variant, rowProps)
        : renderSubGroups({
            parentKey: key,
            groupMarkersList,
            subGroupBy,
            groupContext,
            rowProps,
            variant,
          });

    if (variant === 'list') {
      return (
        <RelationshipGroupedCard
          key={key || 'all'}
          title={title}
          color={color}
          count={count}
          markerIds={markerIds}
        >
          {content}
        </RelationshipGroupedCard>
      );
    }

    return (
      <RelationshipsTreeBranch
        key={key || 'all'}
        title={title}
        color={color}
        count={count}
        markerIds={markerIds}
      >
        {content}
      </RelationshipsTreeBranch>
    );
  });

  if (variant === 'list') {
    return <div className="space-y-1.5">{sections}</div>;
  }

  return sections;
};

export { RelationshipsGroupedSections };
