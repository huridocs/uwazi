import React, { useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  InformationCircleIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { TocSchema } from 'shared/types/commonTypes';
import { Tooltip } from 'flowbite-react';
import { BlankState } from './BlankState';
import { scrollToPage } from './functions';

type ProcessedTocEntry = {
  entry: TocSchema;
  index: number;
  indentation: number;
  topIndex: number;
  isTopLevel: boolean;
};

const normalizeToc = (toc?: TocSchema[]): ProcessedTocEntry[] => {
  if (!toc || !toc.length) {
    return [];
  }

  let currentTopIndex = -1;

  return toc.map((entry, index) => {
    const rawIndentation = entry.indentation ?? 0;
    const isTopLevel = rawIndentation === 0;

    if (isTopLevel) {
      currentTopIndex = index;
    }

    return {
      entry,
      index,
      indentation: Math.max(rawIndentation, 0),
      topIndex: currentTopIndex,
      isTopLevel,
    };
  });
};

const getPageNumber = (entry: TocSchema) => {
  const page = entry.selectionRectangles?.find(rect => rect.page)?.page;
  if (!page) {
    return null;
  }
  const parsed = Number.parseInt(page, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const ToCPanel = ({ toc }: { toc?: TocSchema[] }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const normalizedToc = useMemo(() => normalizeToc(toc), [toc]);

  const toggleExpand = (topIndex: number) => {
    setExpanded(prev => ({ ...prev, [topIndex]: !prev[topIndex] }));
  };

  if (!normalizedToc.length) {
    return (
      <BlankState
        icon={<ListBulletIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />}
        title=<Translate>No Table of contents</Translate>
        description=<Translate>
          You can start by selecting text in the document and clicking the "Add to ToC" button.
        </Translate>
      />
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-gray-900">
          <Translate>Table of contents</Translate>
        </p>
        <Tooltip content="This table of contents was automatically created by the system.">
          <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full tracking-wide flex items-center gap-1">
            <Translate>auto created</Translate>
            <InformationCircleIcon className="w-5 h-5 text-blue-900" />
          </span>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-2">
          {normalizedToc.map(item => {
            const pageNumber = getPageNumber(item.entry);
            const label = item.entry.label?.trim() || `Section ${item.index + 1}`;
            const paddingLeft = item.isTopLevel ? 0 : item.indentation * 16;
            const isInteractive = typeof pageNumber === 'number';
            const parentIndex = item.isTopLevel ? item.index : item.topIndex;
            const isExpanded = expanded[parentIndex] ?? false;
            const shouldHide = !item.isTopLevel && !isExpanded;

            if (shouldHide) {
              return null;
            }

            const hasChildren = item.isTopLevel
              ? normalizedToc.some(
                  otherItem => !otherItem.isTopLevel && otherItem.topIndex === item.index
                )
              : false;
            const isCollapsed = !isExpanded;

            const interactiveProps = isInteractive
              ? {
                  role: 'button' as const,
                  tabIndex: 0,
                  onClick: () => {
                    scrollToPage(pageNumber);
                  },
                  onKeyDown: (event: React.KeyboardEvent) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      scrollToPage(pageNumber);
                    }
                  },
                }
              : {};

            return (
              <div
                key={`toc-${item.index}`}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...interactiveProps}
                className={`border border-gray-100 rounded-xl shadow-sm p-3 flex items-center justify-between gap-4 transition cursor-pointer
                  ${item.isTopLevel ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-inset`}
                style={{ paddingLeft: paddingLeft + 12 }}
              >
                <div className="flex items-center gap-2">
                  {item.isTopLevel && hasChildren ? (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleExpand(item.index);
                      }}
                      className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition"
                      aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                      aria-expanded={isExpanded}
                    >
                      <ChevronDownIcon
                        className={`h-4 w-4 text-gray-700 transition-transform ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                    </button>
                  ) : (
                    <div className="w-6" />
                  )}
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                </div>
                {typeof pageNumber === 'number' && (
                  <p className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                    {pageNumber}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { ToCPanel };
