import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { Button } from '#V2/Components/UI/Button.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';

type ReferenceProps = {
  reference: EntityReference;
  isSelected?: boolean;
  onClick?: () => void;
  onView?: () => void;
  onDelete?: () => void;
};

const Reference = ({ reference, isSelected, onClick, onView, onDelete }: ReferenceProps) => {
  const entityTitle = reference.targetEntity.title || '-';
  const referenceText = reference.reference.text || '';

  const surface = 'bg-(--color-theme-surface-raised)';
  const borderIdle =
    '[border-color:color-mix(in_srgb,var(--color-theme-border-default)_40%,transparent)]';
  const borderClass = isSelected ? 'border-2 border-primary-400' : borderIdle;

  return (
    <div
      className={`flex w-full cursor-pointer flex-col gap-3 rounded-xl border p-4 shadow-sm transition-colors ${surface} ${borderClass}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-ink">{entityTitle}</h3>
      </div>

      {referenceText && (
        <p className="text-sm font-medium leading-relaxed text-ink">{referenceText}</p>
      )}

      <TemplateLabel templateId={reference.targetEntity.templateId} />

      <div className="flex justify-end gap-2 mt-2">
        <Button
          variant="secondary"
          size="small"
          onClick={e => {
            e.stopPropagation();
            onView?.();
          }}
        >
          <Translate>View</Translate>
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={e => {
            e.stopPropagation();
            onDelete?.();
          }}
        >
          <Translate>Delete</Translate>
        </Button>
      </div>
    </div>
  );
};

export { Reference };
