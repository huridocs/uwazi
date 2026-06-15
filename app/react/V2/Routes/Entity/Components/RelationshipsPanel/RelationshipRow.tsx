import React, { useEffect, useRef } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { directionOf } from '#V2/formatters/relationships/types.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { scrollToRelationshipPanelAtom } from '../atoms.js';
import { relationshipsEditModeAtom } from './relationshipsAtom.js';
import { DirectionGlyph } from './DirectionGlyph.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { ListCardRow } from '#V2/Components/UI/ListCardRow.js';
import { PageTag } from './PageTag.js';
import { RelationshipRowCheckbox } from './RelationshipRowCheckbox.js';
import { useRelationshipsPanelZoom } from './useRelationshipsPanelZoom.js';
import { useRelationshipRowVisibility } from './useRelationshipRowVisibility.js';

type RelationshipRowProps = {
  marker: RelationshipMarker;
  selfSharedId: string;
  isSelected?: boolean;
  onClick?: () => void;
  onView?: () => void;
  onDelete?: () => void;
};

const RelationshipRow = ({
  marker,
  selfSharedId,
  isSelected,
  onClick,
  onView,
  onDelete,
}: RelationshipRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrollToRelationshipId, setScrollToRelationshipId] = useAtom(
    scrollToRelationshipPanelAtom
  );
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);
  const editMode = useAtomValue(relationshipsEditModeAtom);
  const { rowPadding, metaHidden, snippetLines } = useRelationshipsPanelZoom();
  const { hideTargetPill, hideTemplateName, hideRelationType } = useRelationshipRowVisibility();
  const referenceText = marker.anchor?.text?.trim() ?? '';
  const referencePage = marker.anchor?.selections?.[0]?.page;
  const templateName =
    templates.find(template => template._id === marker.target.templateId)?.name ?? '';
  const relationshipTypeName =
    relationshipTypes.find(type => type._id === marker.view.type)?.name ??
    marker.view.relationshipTypeName ??
    '';
  const direction = directionOf(marker.view, selfSharedId);

  useEffect(() => {
    if (scrollToRelationshipId !== marker._id) {
      return;
    }
    rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setScrollToRelationshipId(null);
  }, [marker._id, scrollToRelationshipId, setScrollToRelationshipId]);

  return (
    <ListCardRow
      ref={rowRef}
      selected={Boolean(isSelected)}
      onClick={onClick}
      className={rowPadding}
    >
      <div className={`flex items-start justify-between gap-2 ${metaHidden ? 'mb-0' : 'mb-1.5'}`}>
        <div className="flex min-w-0 items-center gap-1.5">
          <RelationshipRowCheckbox relationshipId={marker._id} />
          {!hideTargetPill && (
            <TemplatePill
              templateId={marker.target.templateId}
              label={marker.target.title || '-'}
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {templateName && !metaHidden && !hideTemplateName && (
            <span className="text-[10px] text-ink-tertiary">{templateName}</span>
          )}
          {referencePage !== undefined && <PageTag page={referencePage} onClick={onClick} />}
        </div>
      </div>
      {referenceText && !metaHidden && (
        <p
          className={`text-xs leading-relaxed text-ink-secondary ${
            snippetLines === 1 ? 'line-clamp-1' : 'line-clamp-2'
          }`}
        >
          {referenceText}
        </p>
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
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onView();
              }}
              aria-label={t('System', 'Preview entity', null, false)}
              className="cursor-pointer rounded p-1 text-ink-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-warm hover:text-ink"
            >
              <EyeIcon className="h-3 w-3" />
            </button>
          )}
          {!editMode && onDelete && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label={t('System', 'Delete relationship', null, false)}
              className="cursor-pointer rounded p-1 text-ink-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-emphasis-tint hover:text-emphasis"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </ListCardRow>
  );
};

export { RelationshipRow };
