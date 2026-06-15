import React from 'react';
import { useAtom } from 'jotai';
import { Bars3Icon, Bars4Icon, EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import {
  relationshipsPanelZoomAtom,
  type RelationshipsPanelZoom,
} from './relationshipsPanelFiltersAtom.js';

const zoomOptions: {
  id: RelationshipsPanelZoom;
  label: string;
  Icon: typeof Bars4Icon;
}[] = [
  { id: 'detail', label: 'Detail', Icon: Bars4Icon },
  { id: 'compact', label: 'Compact', Icon: Bars3Icon },
  { id: 'overview', label: 'Overview', Icon: EllipsisHorizontalCircleIcon },
];

type RelationshipsZoomControlProps = {
  disabled?: boolean;
};

const zoomButtonClass = (disabled: boolean, active: boolean, hasBorder: boolean): string => {
  const parts = ['flex h-6 items-center justify-center px-2 transition-colors'];
  if (disabled) parts.push('cursor-not-allowed text-ink-muted');
  else if (active) parts.push('cursor-pointer bg-vellum text-ink');
  else parts.push('cursor-pointer text-ink-tertiary hover:text-ink-secondary');
  if (hasBorder) parts.push('border-l border-border');
  return parts.join(' ');
};

const RelationshipsZoomControl = ({ disabled = false }: RelationshipsZoomControlProps) => {
  const [zoom, setZoom] = useAtom(relationshipsPanelZoomAtom);

  return (
    <div
      role="group"
      aria-label={t('System', 'Row density', null, false)}
      aria-disabled={disabled}
      className={`flex h-6 items-center overflow-hidden rounded-md border border-border ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      {zoomOptions.map((option, index) => {
        const active = zoom === option.id;
        const { Icon } = option;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            aria-label={t('System', option.label, null, false)}
            title={option.label}
            disabled={disabled}
            onClick={() => !disabled && setZoom(option.id)}
            className={zoomButtonClass(disabled, active, index > 0)}
          >
            <Icon className="h-3 w-3" aria-hidden />
          </button>
        );
      })}
    </div>
  );
};

export { RelationshipsZoomControl };
