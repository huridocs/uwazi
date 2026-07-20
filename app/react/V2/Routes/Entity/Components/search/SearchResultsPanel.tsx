import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { SnippetsSearchResponse } from '#V2/api/types.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { NoSearch, NoResults, SearchError } from './BlankState.js';
import { SearchSnippetList } from './SearchSnippetList.js';

type SearchResultsPanelProps = {
  searchError: boolean;
  searchResults: SnippetsSearchResponse | undefined;
  searchTerm: string;
  entityTemplateId: string;
  template?: ClientTemplateSchema;
  activeSnippet: string | null;
  onActivate: (snippetKey: string, pageText: { text: string; page: number }) => void;
};

const SearchResultsPanel = ({
  searchError,
  searchResults,
  searchTerm,
  entityTemplateId,
  template,
  activeSnippet,
  onActivate,
}: SearchResultsPanelProps) => {
  if (searchError) return <SearchError />;
  if (!searchResults && searchTerm) {
    return (
      <p className="text-sm text-ink-muted">
        <Translate>Loading</Translate>
      </p>
    );
  }
  if (!searchResults && !searchTerm) return <NoSearch />;
  if (searchResults?.data && searchResults.data.length < 1) return <NoResults />;
  if (searchResults && searchResults.data.length > 0) {
    return (
      <SearchSnippetList
        results={searchResults}
        entityTemplateId={entityTemplateId}
        template={template}
        activeSnippet={activeSnippet}
        onActivate={onActivate}
      />
    );
  }
  return null;
};

export { SearchResultsPanel };
