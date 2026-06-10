import React from 'react';
import { Tooltip } from 'flowbite-react';
import { ListBulletIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { BlankState } from '#V2/Components/UI/index.js';
import { ToC } from './ToC.js';
import type { useToCPanel } from './useToCPanel.js';

type ToCViewProps = {
  generatedToc?: boolean;
  panel: ReturnType<typeof useToCPanel>;
};

const ToCView = ({ generatedToc, panel }: ToCViewProps) => {
  const {
    tocState,
    isAllExpanded,
    isAllCollapsed,
    expandAll,
    collapseAll,
    toggleExpand,
    handleStateChange,
    handleToCEntryClick,
    handleIndentationChange,
    handleDelete,
    handleLabelChange,
  } = panel;

  return (
    <div className="flex h-full flex-col gap-3 px-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 py-2">
          <p className="text-sm font-bold text-ink">
            <Translate>Table of contents</Translate>
          </p>
          {generatedToc ? (
            <Tooltip
              // eslint-disable-next-line react/style-prop-object
              style="light"
              arrow={false}
              content="This table of contents was automatically created by the system."
            >
              <span className="flex items-center gap-1 rounded-full bg-(--color-theme-surface-warm) px-2 py-0.5 text-xs font-semibold tracking-wide text-ink">
                <Translate className="sr-only">auto created</Translate>
                <SparklesIcon className="h-5 w-5 text-ink" />
              </span>
            </Tooltip>
          ) : null}
        </div>
        {tocState.toc && tocState.toc.length > 0 && !tocState.isEditMode ? (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={expandAll}
              disabled={isAllExpanded}
              className="text-sm font-medium text-ink transition hover:text-ink-secondary disabled:cursor-not-allowed disabled:text-ink-muted"
            >
              <Translate>Expand All</Translate>
            </button>
            <button
              type="button"
              onClick={collapseAll}
              disabled={isAllCollapsed}
              className="text-sm font-medium text-ink transition hover:text-ink-secondary disabled:cursor-not-allowed disabled:text-ink-muted"
            >
              <Translate>Collapse All</Translate>
            </button>
          </div>
        ) : null}
      </div>
      {tocState.toc && tocState.toc.length > 0 ? (
        <ToC
          toc={tocState.toc}
          expanded={tocState.expanded}
          onToggleExpand={toggleExpand}
          onClick={handleToCEntryClick}
          onStateChange={handleStateChange}
          isEditMode={tocState.isEditMode}
          onIndentationChange={handleIndentationChange}
          onDelete={handleDelete}
          onLabelChange={handleLabelChange}
        />
      ) : (
        <BlankState
          icon={
            <ListBulletIcon className="h-7 w-7 rounded-full bg-[color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)] p-1 text-ink" />
          }
          title={<Translate>No Table of contents</Translate>}
          description={
            <Translate>
              You can start by selecting text in the document and clicking the "Add to ToC" button.
            </Translate>
          }
        />
      )}
    </div>
  );
};

export { ToCView };
