import React from 'react';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { ListCardRow } from '#V2/Components/UI/ListCardRow.js';
import { IconButton } from '#V2/Components/UI/IconButton.js';
import { ExpandableText } from '#V2/Components/UI/ExpandableText.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { PageTag } from './PageTag.js';
import { RelationshipRowCheckbox } from './RelationshipRowCheckbox.js';
import { useRelationshipRowData } from './useRelationshipRowData.js';

type RowData = ReturnType<typeof useRelationshipRowData>;

type RelationshipRowNestedEvidenceProps = Pick<
  RowData,
  'rowRef' | 'marker' | 'referenceText' | 'referencePage' | 'editMode'
> & {
  isSelected?: boolean;
  representedIds: string[];
  representedCount?: number;
  onClick?: () => void;
  onView?: () => void;
  onDelete?: () => void;
};

const RelationshipRowNestedEvidence = ({
  rowRef,
  marker,
  referenceText,
  referencePage,
  editMode,
  isSelected,
  representedIds,
  representedCount = 1,
  onClick,
  onView,
  onDelete,
}: RelationshipRowNestedEvidenceProps) => (
  <ListCardRow ref={rowRef} selected={Boolean(isSelected)} onClick={onClick} className="py-1.5!">
    <div className="flex items-start justify-between gap-2 rounded bg-warm/50 px-2 py-1.5">
      <div className="flex min-w-0 flex-1 items-start gap-1.5">
        <RelationshipRowCheckbox relationshipIds={representedIds} />
        {referenceText ? (
          <ExpandableText
            text={referenceText}
            quoted
            className="flex-1"
            textClassName="min-w-0 flex-1 text-xs leading-relaxed text-ink-secondary italic"
          />
        ) : (
          <TemplatePill templateId={marker.target.templateId} label={marker.target.title || '-'} />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {representedCount > 1 && (
          <span
            aria-label={t('System', `${representedCount} matching references`, null, false)}
            className="rounded bg-parchment px-1 text-nano font-medium tabular-nums text-ink-tertiary"
          >
            <Translate>x</Translate>
            {representedCount}
          </span>
        )}
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

export { RelationshipRowNestedEvidence };
export type { RelationshipRowNestedEvidenceProps };
