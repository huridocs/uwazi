import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { RenderIfVisible } from '#V2/Components/UI/index.js';
import { EntityTitle } from '#V2/Routes/Entity/Components/shared/EntityTitle.js';
import { parseSnippetToNodes } from '#V2/Routes/Entity/Components/search/searchUtils.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { fieldLabel } from './libraryResultFieldLabel.js';
import type { LibraryResultView } from './libraryResultSnippets.js';

type LibraryResultsPassagesProps = {
  views: LibraryResultView[];
  folded: boolean;
  templates: ClientTemplateSchema[];
  onFocusProperty: (sharedId: string, fieldKey: string) => void;
  onSelect: (sharedId: string) => void;
};

const passageClass = (folded: boolean) =>
  `block text-sm leading-relaxed text-ink ${folded ? 'line-clamp-1' : ''}`;

const passageTitle = (view: LibraryResultView) => (
  <EntityTitle icon={view.icon} className="min-w-0">
    <span className="truncate">{parseSnippetToNodes(view.titleHtml)}</span>
  </EntityTitle>
);

const PASSAGE_EAGER_COUNT = 15;
const PASSAGE_VISIBLE_OFFSET = 600;
const PASSAGE_ROW_HEIGHT = 64;

const LibraryResultsPassages = ({
  views,
  folded,
  templates,
  onFocusProperty,
  onSelect,
}: LibraryResultsPassagesProps) => {
  let passageIndex = 0;
  const wrapPassage = (passage: React.ReactElement) => {
    const initialVisible = passageIndex < PASSAGE_EAGER_COUNT;
    passageIndex += 1;
    return (
      <RenderIfVisible
        key={passage.key}
        defaultHeight={PASSAGE_ROW_HEIGHT}
        visibleOffset={PASSAGE_VISIBLE_OFFSET}
        initialVisible={initialVisible}
      >
        {passage}
      </RenderIfVisible>
    );
  };

  return (
    <div className="overflow-hidden rounded-md border border-border/60 bg-paper">
      {views.flatMap(view => {
        const template = templates.find(item => item._id === view.template);
        const propertyRows = view.properties.flatMap(group =>
          group.texts.map(text =>
            wrapPassage(
              <button
                key={`${view.sharedId}-${group.fieldKey}-${text}`}
                type="button"
                onClick={() => onFocusProperty(view.sharedId, group.fieldKey)}
                className="w-full cursor-pointer border-b border-border/50 px-3 py-2.5 text-start last:border-b-0 hover:bg-warm"
              >
                <span className={passageClass(folded)}>{parseSnippetToNodes(text)}</span>
                <span className="mt-1 flex min-w-0 items-center gap-1.5 text-meta text-ink-secondary">
                  {passageTitle(view)}
                  <span className="text-ink-muted">·</span>
                  <span className="shrink-0 uppercase tracking-wide text-ink-tertiary">
                    <Translate context={template?._id}>
                      {fieldLabel(group.field, group.fieldKey, template)}
                    </Translate>
                  </span>
                </span>
              </button>
            )
          )
        );
        const documentRows = view.fullText.map(snippet =>
          wrapPassage(
            <button
              key={`${view.sharedId}-doc-${snippet.page}-${snippet.text}`}
              type="button"
              onClick={() => onSelect(view.sharedId)}
              className="w-full cursor-pointer border-b border-border/50 px-3 py-2.5 text-start last:border-b-0 hover:bg-warm"
            >
              <span className={passageClass(folded)}>{parseSnippetToNodes(snippet.text)}</span>
              <span className="mt-1 flex min-w-0 items-center gap-1.5 text-meta text-ink-secondary">
                {passageTitle(view)}
                <span className="text-ink-muted">·</span>
                <bdi dir="ltr" className="shrink-0 uppercase tracking-wide text-ink-tertiary">
                  <Translate>Document</Translate>
                  {snippet.page > 0 ? (
                    <>
                      <span className="mx-1 text-ink-muted">·</span>
                      <Translate>Page</Translate> {snippet.page}
                    </>
                  ) : null}
                </bdi>
              </span>
            </button>
          )
        );
        return [...propertyRows, ...documentRows];
      })}
    </div>
  );
};

export { LibraryResultsPassages };
