import React from 'react';
import { ChevronRightIcon, DocumentTextIcon, TagIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { ColorDot, CountBadge } from '#V2/Components/UI/index.js';
import { EntityTitle } from '#V2/Routes/Entity/Components/shared/EntityTitle.js';
import { parseSnippetToNodes } from '#V2/Routes/Entity/Components/search/searchUtils.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { fieldLabel } from './libraryResultFieldLabel.js';
import { LibraryResultSectionLabel } from './LibraryResultSectionLabel.js';
import type { LibraryResultView } from './libraryResultSnippets.js';

type LibraryResultsGroupedCardProps = {
  view: LibraryResultView;
  folded: boolean;
  template?: ClientTemplateSchema;
  onToggle?: () => void;
  onFocusProperty: (sharedId: string, fieldKey: string) => void;
  onSelect: (sharedId: string) => void;
};

const pageWord = (count: number) =>
  count === 1 ? <Translate>Page</Translate> : <Translate>Pages</Translate>;

const LibraryResultsGroupedCard = ({
  view,
  folded,
  template,
  onToggle,
  onFocusProperty,
  onSelect,
}: LibraryResultsGroupedCardProps) => {
  const hasBody = view.properties.length > 0 || view.fullText.length > 0;
  const foldLabel = folded
    ? t('System', 'Show the matches in', null, false)
    : t('System', 'Hide the matches in', null, false);

  return (
    <article className="overflow-hidden rounded-md border border-border/60 bg-paper">
      <div className={hasBody && !folded ? 'border-b border-border/40' : ''}>
        <div className="flex items-start gap-2 px-3 py-2">
          {onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={!folded}
              aria-label={`${foldLabel} ${view.title}`}
              className="mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink-muted hover:text-ink"
            >
              <ChevronRightIcon
                className={`h-3.5 w-3.5 ${folded ? '' : 'rotate-90'}`}
                aria-hidden
              />
            </button>
          ) : (
            <span aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {template?.color ? <ColorDot color={template.color} size="md" /> : null}
              <button
                type="button"
                onClick={() => onSelect(view.sharedId)}
                aria-label={view.title}
                className="min-w-0 flex-1 text-start text-sm font-medium text-ink hover:underline"
              >
                <EntityTitle icon={view.icon}>
                  <span className="min-w-0 truncate">{parseSnippetToNodes(view.titleHtml)}</span>
                </EntityTitle>
              </button>
              <CountBadge count={view.count} />
            </div>
            {template ? (
              <p className={`mt-0.5 text-meta text-ink-tertiary ${template.color ? 'ps-4' : ''}`}>
                <Translate context={template._id}>{template.name}</Translate>
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {hasBody && !folded ? (
        <div className="flex flex-col gap-3 px-3 py-3">
          {view.properties.length > 0 ? (
            <section className="flex flex-col gap-1">
              <LibraryResultSectionLabel icon={<TagIcon className="h-3 w-3" />}>
                <Translate>Properties</Translate>
              </LibraryResultSectionLabel>
              {view.properties.map(group => (
                <button
                  key={group.fieldKey}
                  type="button"
                  onClick={() => onFocusProperty(view.sharedId, group.fieldKey)}
                  className="w-full cursor-pointer rounded-md bg-warm/50 px-2 py-1.5 text-start hover:bg-parchment"
                >
                  <LibraryResultSectionLabel>
                    <Translate context={template?._id}>
                      {fieldLabel(group.field, group.fieldKey, template)}
                    </Translate>
                  </LibraryResultSectionLabel>
                  {group.texts.map(text => (
                    <span key={text} className="block text-sm leading-relaxed text-ink">
                      {parseSnippetToNodes(text)}
                    </span>
                  ))}
                </button>
              ))}
            </section>
          ) : null}
          {view.fullText.length > 0 ? (
            <section className="flex flex-col gap-1">
              <LibraryResultSectionLabel icon={<DocumentTextIcon className="h-3 w-3" />}>
                <Translate>Document</Translate>
                <span className="font-normal normal-case tracking-normal text-ink-muted">
                  <span className="tabular-nums">{view.fullText.length}</span>{' '}
                  {pageWord(view.fullText.length)}
                </span>
              </LibraryResultSectionLabel>
              {view.fullText.map(snippet => (
                <button
                  key={`${snippet.page}-${snippet.text}`}
                  type="button"
                  onClick={() => onSelect(view.sharedId)}
                  className="w-full cursor-pointer rounded-md px-2 py-1.5 text-start text-sm leading-relaxed text-ink hover:bg-warm"
                >
                  {parseSnippetToNodes(snippet.text)}
                  {snippet.page > 0 ? (
                    <bdi
                      dir="ltr"
                      className="ms-1.5 whitespace-nowrap text-meta font-semibold text-ink-tertiary"
                    >
                      <Translate>Page</Translate> {snippet.page}
                    </bdi>
                  ) : null}
                </button>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

export { LibraryResultsGroupedCard };
