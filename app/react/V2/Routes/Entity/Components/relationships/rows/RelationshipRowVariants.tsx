/* eslint-disable react/no-multi-comp */
import React from 'react';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { ListCardRow } from '#V2/Components/UI/ListCardRow.js';
import { IconButton } from '#V2/Components/UI/IconButton.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { DirectionGlyph } from './DirectionGlyph.js';
import { PageTag } from './PageTag.js';
import { RelationshipRowCheckbox } from './RelationshipRowCheckbox.js';
import { useRelationshipRowData } from './useRelationshipRowData.js';

type RowData = ReturnType<typeof useRelationshipRowData>;

type RelationshipRowBaseProps = RowData & {
  isSelected?: boolean;
  onClick?: () => void;
};

type RelationshipRowDetailProps = RelationshipRowBaseProps & {
  onView?: () => void;
  onDelete?: () => void;
  nested?: boolean;
};

const RelationshipRowNestedEvidence = ({
  rowRef,
  referenceText,
  referencePage,
  editMode,
  isSelected,
  onClick,
  onView,
  onDelete,
}: Pick<
  RelationshipRowBaseProps,
  'rowRef' | 'referenceText' | 'referencePage' | 'isSelected' | 'onClick'
> &
  Pick<RelationshipRowDetailProps, 'editMode' | 'onView' | 'onDelete'>) => (
  <ListCardRow ref={rowRef} selected={Boolean(isSelected)} onClick={onClick} className="py-1.5!">
    <div className="flex items-start justify-between gap-2 rounded bg-warm/50 px-2 py-1.5">
      {referenceText ? (
        <p className="line-clamp-2 min-w-0 flex-1 text-xs leading-relaxed text-ink-secondary italic">
          {referenceText}
        </p>
      ) : (
        <span className="min-w-0 flex-1" />
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        {referencePage !== undefined && <PageTag page={referencePage} onClick={onClick} />}
        {!editMode && onView && (
          <IconButton
            variant="ghost"
            showOnGroupHover
            aria-label={t('System', 'Preview entity', null, false)}
            onClick={e => {
              e.stopPropagation();
              onView();
            }}
          >
            <EyeIcon className="h-3 w-3" />
          </IconButton>
        )}
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

const TargetPill = ({ marker, hideTargetPill }: Pick<RowData, 'marker' | 'hideTargetPill'>) =>
  hideTargetPill ? null : (
    <TemplatePill templateId={marker.target.templateId} label={marker.target.title || '-'} />
  );

const RelationshipRowOverview = ({
  rowRef,
  marker,
  hideTargetPill,
  referencePage,
  isSelected,
  onClick,
}: RelationshipRowBaseProps) => (
  <ListCardRow ref={rowRef} selected={Boolean(isSelected)} onClick={onClick} className="py-1.5!">
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <RelationshipRowCheckbox relationshipId={marker._id} />
        <TargetPill marker={marker} hideTargetPill={hideTargetPill} />
      </div>
      {referencePage !== undefined && <PageTag page={referencePage} onClick={onClick} />}
    </div>
  </ListCardRow>
);

const RelationshipRowCompact = ({
  rowRef,
  marker,
  hideTargetPill,
  hideRelationType,
  relationshipTypeName,
  direction,
  referencePage,
  isSelected,
  onClick,
}: RelationshipRowBaseProps) => (
  <ListCardRow ref={rowRef} selected={Boolean(isSelected)} onClick={onClick} className="py-2!">
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <RelationshipRowCheckbox relationshipId={marker._id} />
        <TargetPill marker={marker} hideTargetPill={hideTargetPill} />
        <DirectionGlyph direction={direction} />
        {!hideRelationType && relationshipTypeName && (
          <span className="truncate text-[10px] capitalize text-ink-tertiary">
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
  hideTargetPill,
  hideTemplateName,
  hideRelationType,
  templateName,
  relationshipTypeName,
  direction,
  referenceText,
  referencePage,
  editMode,
  isSelected,
  onClick,
  onView,
  onDelete,
  nested = false,
}: RelationshipRowDetailProps) => {
  if (nested) {
    return (
      <RelationshipRowNestedEvidence
        rowRef={rowRef}
        referenceText={referenceText}
        referencePage={referencePage}
        editMode={editMode}
        isSelected={isSelected}
        onClick={onClick}
        onView={onView}
        onDelete={onDelete}
      />
    );
  }

  return (
    <ListCardRow ref={rowRef} selected={Boolean(isSelected)} onClick={onClick}>
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <RelationshipRowCheckbox relationshipId={marker._id} />
          <TargetPill marker={marker} hideTargetPill={hideTargetPill} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {templateName && !hideTemplateName && (
            <span className="text-[10px] text-ink-tertiary">{templateName}</span>
          )}
          {referencePage !== undefined && <PageTag page={referencePage} onClick={onClick} />}
        </div>
      </div>
      {referenceText && (
        <p className="line-clamp-2 text-xs leading-relaxed text-ink-secondary">{referenceText}</p>
      )}
      <div className="mt-1 flex items-center justify-between text-[10px] text-ink-tertiary">
        <span className="flex items-center gap-1">
          <DirectionGlyph direction={direction} />
          {!hideRelationType && relationshipTypeName && (
            <span className="capitalize">{relationshipTypeName}</span>
          )}
        </span>
        <div className="flex items-center gap-0.5">
          {!editMode && onView && (
            <IconButton
              variant="ghost"
              showOnGroupHover
              aria-label={t('System', 'Preview entity', null, false)}
              onClick={e => {
                e.stopPropagation();
                onView();
              }}
            >
              <EyeIcon className="h-3 w-3" />
            </IconButton>
          )}
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
