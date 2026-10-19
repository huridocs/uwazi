import React from 'react';
import { Translate } from '#app/I18N/index.js';
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

const LibraryResultsPassages = ({
  views,
  folded,
  templates,
  onFocusProperty,
  onSelect,
}: LibraryResultsPassagesProps) => (
  <div className="overflow-hidden rounded-md border border-border/60 bg-paper">
    {views.flatMap(view => {
      const template = templates.find(item => item._id === view.template);
      const propertyRows = view.properties.flatMap(group =>
        group.texts.map(text => (
          <button
            key={`${view.sharedId}-${group.fieldKey}-${text}`}
            type="button"
            onClick={() => onFocusProperty(view.sharedId, group.fieldKey)}
            className="w-full cursor-pointer border-b border-border/50 px-3 py-2.5 text-start last:border-b-0 hover:bg-warm"
          >
            <span className={passageClass(folded)}>{parseSnippetToNodes(text)}</span>
            <span className="mt-1 flex min-w-0 items-center gap-1.5 text-meta text-ink-secondary">
              <span className="truncate">{parseSnippetToNodes(view.titleHtml)}</span>
              <span className="text-ink-muted">·</span>
              <span className="shrink-0 uppercase tracking-wide text-ink-tertiary">
                <Translate context={template?._id}>
                  {fieldLabel(group.field, group.fieldKey, template)}
                </Translate>
              </span>
            </span>
          </button>
        ))
      );
      const documentRows = view.fullText.map(snippet => (
        <button
          key={`${view.sharedId}-doc-${snippet.page}-${snippet.text}`}
          type="button"
          onClick={() => onSelect(view.sharedId)}
          className="w-full cursor-pointer border-b border-border/50 px-3 py-2.5 text-start last:border-b-0 hover:bg-warm"
        >
          <span className={passageClass(folded)}>{parseSnippetToNodes(snippet.text)}</span>
          <span className="mt-1 flex min-w-0 items-center gap-1.5 text-meta text-ink-secondary">
            <span className="truncate">{parseSnippetToNodes(view.titleHtml)}</span>
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
      ));
      return [...propertyRows, ...documentRows];
    })}
  </div>
);

export { LibraryResultsPassages };
