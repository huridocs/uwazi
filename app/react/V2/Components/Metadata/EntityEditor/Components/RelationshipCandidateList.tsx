import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { debounce } from '#app/utils/index.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import type { MultiselectListOption } from '#V2/Components/Forms/index.js';

type RelationshipCandidatePage = {
  options: MultiselectListOption[];
  total: number;
  fetched: number;
};

type RelationshipCandidateSearch = (
  search: string,
  offset?: number
) => Promise<RelationshipCandidatePage>;

const OPTIONS_TO_SHOW = 5;

const emptyPage = (): {
  candidates: MultiselectListOption[];
  total: number;
  fetched: number;
} => ({
  candidates: [],
  total: 0,
  fetched: 0,
});

const candidateLabel = (option: MultiselectListOption) =>
  typeof option.label === 'string' ? option.label : option.searchLabel;

const uniqueCandidates = (options: MultiselectListOption[]) =>
  options.filter(
    (option, index, list) => list.findIndex(other => other.value === option.value) === index
  );

const unselected = (options: MultiselectListOption[], selectedIds: string[]) =>
  options.filter(option => !selectedIds.includes(option.value));

const useRelationshipCandidates = ({
  lookupSearch,
  selectedIds,
  adding,
  query,
}: {
  lookupSearch: RelationshipCandidateSearch | undefined;
  selectedIds: string[];
  adding: boolean;
  query: string;
}) => {
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(emptyPage());

  const runSearch = async (search: string) => {
    if (!lookupSearch) {
      setPage(emptyPage());
      return;
    }
    const result = await lookupSearch(search);
    setPage({
      candidates: unselected(result.options, selectedIds),
      total: result.total,
      fetched: result.fetched,
    });
  };

  const loadMore = () => {
    if (!lookupSearch || page.fetched >= page.total) {
      return;
    }
    lookupSearch(query, page.fetched)
      .then(result => {
        setPage(current => ({
          candidates: uniqueCandidates([
            ...current.candidates,
            ...unselected(result.options, selectedIds),
          ]),
          total: result.total,
          fetched: current.fetched + result.fetched,
        }));
      })
      .catch(() => undefined);
  };

  const runSearchRef = useRef(runSearch);
  runSearchRef.current = runSearch;

  const debouncedSearch = useMemo(
    () =>
      debounce((search: string) => {
        runSearchRef.current(search).catch(() => undefined);
      }, 300),
    []
  );

  useEffect(() => {
    if (!adding) {
      return;
    }
    if (!query) {
      runSearchRef.current('').catch(() => undefined);
      return;
    }
    debouncedSearch(query);
  }, [adding, debouncedSearch, query]);

  const reset = () => {
    setShowAll(false);
    setPage(emptyPage());
  };

  return { ...page, showAll, setShowAll, reset, loadMore };
};

const RelationshipCandidateList = ({
  candidates,
  disabled,
  expanded,
  fetched,
  targetTemplateId,
  total,
  onAdd,
  onLoadMore,
  onToggle,
}: {
  candidates: MultiselectListOption[];
  disabled: boolean;
  expanded: boolean;
  fetched: number;
  targetTemplateId?: string;
  total: number;
  onAdd: (option: MultiselectListOption) => void;
  onLoadMore: () => void;
  onToggle: () => void;
}) => {
  const collapsed = !expanded && candidates.length > OPTIONS_TO_SHOW;
  const visible = collapsed ? candidates.slice(0, OPTIONS_TO_SHOW) : candidates;
  const hidden = candidates.length - visible.length;
  const remaining = total - fetched;

  return (
    <>
      <div className={collapsed ? 'max-h-45 overflow-auto' : 'max-h-80 overflow-auto'}>
        {visible.length === 0 ? (
          <div className="px-3 py-2 text-xs text-ink-muted">
            <Translate>No matching entities.</Translate>
          </div>
        ) : (
          visible.map(option => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onAdd(option)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-start transition-colors hover:bg-warm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <TemplatePill templateId={targetTemplateId ?? ''} label={candidateLabel(option)} />
            </button>
          ))
        )}
      </div>
      {hidden > 0 || expanded ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center gap-1 border-t border-border px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-warm"
        >
          {expanded ? (
            <Translate>x less</Translate>
          ) : (
            <>
              {hidden} <Translate>x more</Translate>
            </>
          )}
        </button>
      ) : null}
      {!collapsed && remaining > 0 ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="flex w-full cursor-pointer items-center gap-1 border-t border-border px-3 py-1.5 text-start text-xs text-ink-tertiary hover:bg-warm"
        >
          {remaining} <Translate>more options.</Translate>
        </button>
      ) : null}
    </>
  );
};

export { RelationshipCandidateList, useRelationshipCandidates };
export type { RelationshipCandidatePage, RelationshipCandidateSearch };
