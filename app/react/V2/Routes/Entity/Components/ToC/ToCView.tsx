import React from 'react';
import { Tooltip } from 'flowbite-react';
import { ListBulletIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { useEntityHashParams } from '../../entityUrlState.js';
import { PAGE_PARAM } from '../../urlParams.js';
import { ToC } from './ToC.js';
import { findItemsWithChildren, normalizeToc } from './utils.js';
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

  const hashParams = useEntityHashParams();
  const currentPage = Number.parseInt(hashParams.get(PAGE_PARAM) || '1', 10);
  const hasEntries = Boolean(tocState.toc && tocState.toc.length > 0);
  const hasAnyChildren = hasEntries
    ? findItemsWithChildren(normalizeToc(tocState.toc)).length > 0
    : false;

  if (!hasEntries) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <ListBulletIcon className="h-8 w-8 text-ink-tertiary/40" />
        <div>
          <p className="text-sm font-semibold text-ink-tertiary">
            <Translate>No ToC</Translate>
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">
            <Translate>
              You can start by selecting text in the document and clicking the "Add to ToC" button.
            </Translate>
          </p>
        </div>
      </div>
    );
  }

  const sparkles = <SparklesIcon className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden />;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-ink">
            <Translate>Table of contents</Translate>
          </span>
          {generatedToc ? (
            <Tooltip
              // eslint-disable-next-line react/style-prop-object
              style="light"
              arrow={false}
              content="This table of contents was automatically created by the system."
            >
              <span className="inline-flex">
                <Translate className="sr-only">auto created</Translate>
                {sparkles}
              </span>
            </Tooltip>
          ) : (
            sparkles
          )}
        </div>
        {hasAnyChildren && !tocState.isEditMode ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={collapseAll}
              disabled={isAllCollapsed}
              className="cursor-pointer text-xs text-ink-tertiary transition-colors hover:text-ink-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Translate>Collapse All</Translate>
            </button>
            <button
              type="button"
              onClick={expandAll}
              disabled={isAllExpanded}
              className="cursor-pointer text-xs font-medium text-ink-secondary transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Translate>Expand All</Translate>
            </button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-1">
        <ToC
          toc={tocState.toc}
          expanded={tocState.expanded}
          onToggleExpand={toggleExpand}
          onClick={handleToCEntryClick}
          onStateChange={handleStateChange}
          isEditMode={tocState.isEditMode}
          currentPage={currentPage}
          onIndentationChange={handleIndentationChange}
          onDelete={handleDelete}
          onLabelChange={handleLabelChange}
        />
      </div>
    </div>
  );
};

export { ToCView };
