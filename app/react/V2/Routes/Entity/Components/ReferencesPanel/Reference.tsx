import React, { useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';
import { EntityReference } from '#V2/domain/entities/types.js';
import { Button } from '#V2/Components/UI/Button.js';

const getTextColor = (backgroundHex: string): string => {
  if (!backgroundHex) {
    return '#000';
  }

  let hexColor = backgroundHex.replace('#', '').trim();

  if (hexColor.length === 3) {
    hexColor = hexColor
      .split('')
      .map(x => x + x)
      .join('');
  }

  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? '#000' : '#FFF';
};

type ReferenceProps = {
  reference: EntityReference;
  isSelected?: boolean;
  onClick?: () => void;
  onView?: () => void;
  onDelete?: () => void;
};

const Reference = ({ reference, isSelected, onClick, onView, onDelete }: ReferenceProps) => {
  const entityTitle = reference.targetEntity.title || '-';
  const templateName = reference.targetEntity.template.name || '';
  const templateColor = reference.targetEntity.template.color || '#A4CAFE';
  const referenceText = reference.reference.text || '';
  const textColor = useMemo(() => getTextColor(templateColor), [templateColor]);

  return (
    <div
      className={`w-full border rounded-xl shadow-sm p-4 bg-white flex flex-col gap-3 cursor-pointer transition-colors ${
        isSelected ? 'border-primary-400 border-2' : 'border-gray-100'
      }`}
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
        <h3 className="text-sm font-bold text-gray-900">{entityTitle}</h3>
      </div>

      {referenceText && (
        <p className="text-sm font-medium text-gray-900 leading-relaxed">{referenceText}</p>
      )}

      {templateName && (
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium px-2 py-1 rounded-sm"
            style={{ backgroundColor: templateColor, color: textColor }}
          >
            {templateName}
          </span>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-2">
        <Button
          styling="outline"
          color="primary"
          size="small"
          onClick={e => {
            e.stopPropagation();
            onView?.();
          }}
        >
          <Translate>View</Translate>
        </Button>
        <Button
          styling="outline"
          color="primary"
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
