import React from 'react';
import { useAtom } from 'jotai';
import { Bars3BottomLeftIcon, ShareIcon, QueueListIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import {
  relationshipsPanelViewAtom,
  type RelationshipsPanelView,
} from './relationshipsPanelFiltersAtom.js';

const options: { id: RelationshipsPanelView; label: string; Icon: typeof QueueListIcon }[] = [
  { id: 'list', label: 'List', Icon: Bars3BottomLeftIcon },
  { id: 'tree', label: 'Tree', Icon: QueueListIcon },
  { id: 'graph', label: 'Graph', Icon: ShareIcon },
];

const RelationshipsViewControls = () => {
  const [view, setView] = useAtom(relationshipsPanelViewAtom);

  return (
    <div
      role="group"
      aria-label={t('System', 'View', null, false)}
      className="flex h-6 items-center overflow-hidden rounded-md border border-border"
    >
      {options.map((option, index) => {
        const active = view === option.id;
        const { Icon } = option;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            aria-label={t('System', option.label, null, false)}
            title={option.label}
            onClick={() => setView(option.id)}
            className={`flex h-6 items-center justify-center gap-1 px-2 text-[11px] font-medium transition-colors ${
              active
                ? 'bg-vellum text-ink'
                : 'text-ink-tertiary hover:bg-warm hover:text-ink-secondary'
            } ${index > 0 ? 'border-l border-border' : ''}`}
          >
            <Icon className="h-3 w-3" aria-hidden />
            <span className="hidden sm:inline">
              <Translate>{option.label}</Translate>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export { RelationshipsViewControls };
