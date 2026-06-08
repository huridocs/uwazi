import React, { useRef, useState } from 'react';
import {
  ChevronDownIcon,
  DocumentTextIcon,
  LinkIcon,
  PlusIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useOnClickOutsideElement } from '#app/utils/useOnClickOutsideElementHook.js';
import { Button } from '#V2/Components/UI/Button.js';
import type { ContextAddOptionId, ContextChip, ContextScopeMode } from './types.js';

type BertContextBarProps = {
  contextMode: ContextScopeMode;
  contextModeLabel: string;
  contextChips: ContextChip[];
  onContextModeChange: (mode: ContextScopeMode) => void;
  onRemoveChip: (chipId: string) => void;
  onAddOption: (optionId: ContextAddOptionId) => void;
};

const ADD_MENU_SECTIONS: {
  title: string;
  options: { id: ContextAddOptionId; label: string; suffix?: string }[];
}[] = [
  {
    title: 'Deepen',
    options: [{ id: 'page', label: 'Page' }],
  },
  {
    title: 'Facets',
    options: [
      { id: 'template', label: 'Template' },
      { id: 'connections', label: 'Connections' },
      { id: 'files', label: 'Files' },
    ],
  },
  {
    title: 'Attach',
    options: [
      { id: 'entity', label: 'Entity', suffix: '…' },
      { id: 'file', label: 'File', suffix: '…' },
    ],
  },
];

const chipIcon = (kind: ContextChip['kind']) => {
  if (kind === 'link') return <LinkIcon className="h-3.5 w-3.5 shrink-0" />;
  if (kind === 'entity') return <UserIcon className="h-3.5 w-3.5 shrink-0" />;
  return <DocumentTextIcon className="h-3.5 w-3.5 shrink-0" />;
};

const BertContextBar = ({
  contextMode,
  contextModeLabel,
  contextChips,
  onContextModeChange,
  onRemoveChip,
  onAddOption,
}: BertContextBarProps) => {
  const [scopeOpen, setScopeOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const scopeRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);

  useOnClickOutsideElement(scopeRef, () => setScopeOpen(false));
  useOnClickOutsideElement(addRef, () => setAddOpen(false));

  return (
    <div className="px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-fit shrink-0" ref={scopeRef}>
          <button
            type="button"
            onClick={() => setScopeOpen(open => !open)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-paper px-2 py-1 text-xs font-medium text-ink-secondary transition-colors hover:bg-warm"
          >
            <span className="text-ink-muted">Context</span>
            <span className="text-ink">{contextModeLabel}</span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-ink-muted" />
          </button>
          {scopeOpen ? (
            <ul
              role="menu"
              className="absolute left-0 top-full z-20 m-0 mt-1 min-w-full w-max list-none rounded-md border border-border bg-paper py-1 shadow-sm"
            >
              {(
                [
                  { id: 'auto', label: 'Auto' },
                  { id: 'this-document', label: 'This document' },
                ] as const
              ).map(option => (
                <li key={option.id} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={[
                      'block w-full cursor-pointer px-3 py-1.5 text-left text-xs',
                      contextMode === option.id
                        ? 'bg-parchment font-medium text-ink'
                        : 'text-ink-secondary hover:bg-warm',
                    ].join(' ')}
                    onClick={() => {
                      onContextModeChange(option.id);
                      setScopeOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {contextChips.map(chip => (
          <span
            key={chip.id}
            className={[
              'inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs',
              chip.kind === 'link'
                ? 'border border-border bg-paper text-ink-secondary'
                : 'bg-primary-100 text-primary-800',
            ].join(' ')}
          >
            {chipIcon(chip.kind)}
            <span className="truncate">{chip.label}</span>
            {chip.removable ? (
              <button
                type="button"
                onClick={() => onRemoveChip(chip.id)}
                className="cursor-pointer rounded p-0.5 hover:bg-primary-200/60"
                aria-label={`Remove ${chip.label}`}
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            ) : null}
          </span>
        ))}

        <div className="relative w-fit shrink-0" ref={addRef}>
          <Button
            type="button"
            variant="ghost"
            size="small"
            className="inline-flex cursor-pointer items-center gap-1 px-2"
            onClick={() => setAddOpen(open => !open)}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add
          </Button>
          {addOpen ? (
            <div
              role="menu"
              className="absolute left-0 top-full z-20 mt-1 w-44 rounded-md border border-border bg-paper py-2 shadow-sm"
            >
              {ADD_MENU_SECTIONS.map(section => (
                <div key={section.title} className="px-2 pb-1 last:pb-0">
                  <p className="px-2 py-1 text-left text-[0.625rem] font-semibold uppercase tracking-wide text-ink-muted">
                    {section.title}
                  </p>
                  <ul className="m-0 list-none p-0">
                    {section.options.map(option => (
                      <li key={option.id} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          className="block w-full cursor-pointer rounded px-2 py-1.5 text-left text-xs text-ink-secondary hover:bg-warm hover:text-ink"
                          onClick={() => {
                            onAddOption(option.id);
                            setAddOpen(false);
                          }}
                        >
                          {option.label}
                          {option.suffix ?? ''}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export { BertContextBar };
export type { BertContextBarProps };
