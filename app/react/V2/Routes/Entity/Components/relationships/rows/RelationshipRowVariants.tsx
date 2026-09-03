/* eslint-disable react/no-multi-comp */
import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { ListCardRow } from '#V2/Components/UI/ListCardRow.js';
import { IconButton } from '#V2/Components/UI/IconButton.js';
import { ExpandableText } from '#V2/Components/UI/ExpandableText.js';
import { DirectionGlyph } from './DirectionGlyph.js';
import { PageTag } from './PageTag.js';
import { RelationshipRowNestedEvidence } from './RelationshipRowNestedEvidence.js';
import { RelationshipRowCheckbox } from './RelationshipRowCheckbox.js';
import { EntityTemplateLink } from './EntityTemplateLink.js';
import { useRelationshipRowData } from './useRelationshipRowData.js';

type RowData = ReturnType<typeof useRelationshipRowData>;

type RelationshipRowBaseProps = RowData & {
  isSelected?: boolean;
  representedIds: string[];
  onClick?: () => void;
};

type RelationshipRowDetailProps = RelationshipRowBaseProps & {
  onDelete?: () => void;
  nested?: boolean;
  representedCount?: number;
};

const TargetPill = ({ marker, hideTargetPill }: Pick<RowData, 'marker' | 'hideTargetPill'>) =>
  hideTargetPill ? null : (
    <EntityTemplateLink
      sharedId={marker.target.sharedId}
      templateId={marker.target.templateId}
      label={marker.target.title || '-'}
    />
  );

const RelationshipRowOverview = ({
  rowRef,
  marker,
  representedIds,
  hideTargetPill,
  referencePage,
  isSelected,
  onClick,
}: RelationshipRowBaseProps) => (
  <ListCardRow ref={rowRef} selected={Boolean(isSelected)} className="py-1.5!">
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <RelationshipRowCheckbox relationshipIds={representedIds} />
        <TargetPill marker={marker} hideTargetPill={hideTargetPill} />
      </div>
      {referencePage !== undefined && <PageTag page={referencePage} onClick={onClick} />}
    </div>
  </ListCardRow>
);

const RelationshipRowCompact = ({
  rowRef,
  marker,
  representedIds,
  hideTargetPill,
  relationshipTypeName,
  direction,
  referencePage,
  isSelected,
  onClick,
}: RelationshipRowBaseProps) => (
  <ListCardRow ref={rowRef} selected={Boolean(isSelected)} className="py-2!">
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <RelationshipRowCheckbox relationshipIds={representedIds} />
        <TargetPill marker={marker} hideTargetPill={hideTargetPill} />
        <DirectionGlyph direction={direction} />
        {relationshipTypeName && (
          <span className="truncate text-nano capitalize text-ink-tertiary">
            {relationshipTypeName}
          </span>
        )}
      </div>
      {referencePage !== undefined && <PageTag page={referencePage} onClick={onClick} />}
    </div>
  </ListCardRow>
);

const RelationshipRowDetail = ({
  rowRef,
  marker,
  representedIds,
  hideTargetPill,
  hideTemplateName,
  templateName,
  relationshipTypeName,
  direction,
  referenceText,
  referencePage,
  editMode,
  isSelected,
  representedCount,
  onClick,
  onDelete,
  nested = false,
}: RelationshipRowDetailProps) => {
  if (nested) {
    return (
      <RelationshipRowNestedEvidence
        rowRef={rowRef}
        referenceText={referenceText}
        referencePage={referencePage}
        marker={marker}
        editMode={editMode}
        isSelected={isSelected}
        representedIds={representedIds}
        representedCount={representedCount}
        onClick={onClick}
        onDelete={onDelete}
      />
    );
  }

  return (
    <ListCardRow ref={rowRef} selected={Boolean(isSelected)}>
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <RelationshipRowCheckbox relationshipIds={representedIds} />
          <TargetPill marker={marker} hideTargetPill={hideTargetPill} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {templateName && !hideTemplateName && (
            <span className="text-nano text-ink-tertiary">{templateName}</span>
          )}
          {referencePage !== undefined && <PageTag page={referencePage} onClick={onClick} />}
        </div>
      </div>
      {referenceText && (
        <ExpandableText
          text={referenceText}
          quoted
          onActivate={onClick}
          textClassName="min-w-0 text-xs italic leading-relaxed text-ink-secondary"
        />
      )}
      <div className="mt-1 flex items-center justify-between text-nano text-ink-tertiary">
        <span className="flex items-center gap-1">
          <DirectionGlyph direction={direction} />
          {relationshipTypeName && <span className="capitalize">{relationshipTypeName}</span>}
        </span>
        <div className="flex items-center gap-0.5">
          {!editMode && onDelete && (
            <IconButton
              variant="danger"
              showOnGroupHover
              aria-label={t('System', 'Delete relationship', null, false)}
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <TrashIcon className="h-3 w-3" />
            </IconButton>
          )}
        </div>
      </div>
    </ListCardRow>
  );
};

export {
  RelationshipRowOverview,
  RelationshipRowCompact,
  RelationshipRowDetail,
  RelationshipRowNestedEvidence,
};
