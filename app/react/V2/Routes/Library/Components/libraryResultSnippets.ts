import type {
  LibraryHitSnippets,
  LibrarySearchHit,
  LibrarySnippetFullText,
  LibrarySnippetMetadata,
} from '#shared/types/librarySearch.js';
import { esFieldToFocusKey } from '#V2/Components/Metadata/focusMetadataFieldAtom.js';
import type { EntityIconData } from '#V2/Components/CustomIcons/index.js';
import { libraryFacetIcon } from '#V2/services/search/libraryFacetIcon.js';

type MatchType = 'title' | 'properties' | 'document';

type MatchTypeFilters = Record<MatchType, boolean>;

type PropertySnippet = {
  field: string;
  fieldKey: string;
  texts: string[];
};

type LibraryResultView = {
  sharedId: string;
  template: string;
  title: string;
  titleHtml: string;
  icon?: EntityIconData;
  year?: string;
  properties: PropertySnippet[];
  fullText: LibrarySnippetFullText[];
  count: number;
  hasTitle: boolean;
  hasProperties: boolean;
  hasDocument: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const metadataRows = (value: unknown): LibrarySnippetMetadata[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap(row => {
    if (!isRecord(row) || typeof row.field !== 'string' || !Array.isArray(row.texts)) return [];
    const texts = row.texts.filter(
      (text): text is string => typeof text === 'string' && text.length > 0
    );
    return texts.length ? [{ field: row.field, texts }] : [];
  });
};

const fullTextRows = (value: unknown): LibrarySnippetFullText[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap(row => {
    if (!isRecord(row) || typeof row.text !== 'string' || !row.text) return [];
    const page = typeof row.page === 'number' && row.page > 0 ? row.page : 0;
    return [{ text: row.text, page }];
  });
};

const readSnippets = (hit: LibrarySearchHit): LibraryHitSnippets | undefined => {
  if (!isRecord(hit.snippets)) return undefined;
  const metadata = metadataRows(hit.snippets.metadata);
  const fullText = fullTextRows(hit.snippets.fullText);
  if (!metadata.length && !fullText.length) return undefined;
  const count =
    typeof hit.snippets.count === 'number' ? hit.snippets.count : metadata.length + fullText.length;
  return { count, metadata, fullText };
};

const creationYear = (value?: number) => {
  if (!value || value < 1e11) return undefined;
  const year = new Date(value).getUTCFullYear();
  return Number.isFinite(year) ? String(year) : undefined;
};

const isTitleField = (field: string) => esFieldToFocusKey(field) === 'title';

const toResultView = (hit: LibrarySearchHit, snippets: LibraryHitSnippets): LibraryResultView => {
  const titleHit = snippets.metadata.find(row => isTitleField(row.field));
  const properties = snippets.metadata
    .filter(row => !isTitleField(row.field))
    .map(row => ({
      field: row.field,
      fieldKey: esFieldToFocusKey(row.field),
      texts: row.texts,
    }));

  const icon = libraryFacetIcon(hit.icon);
  return {
    sharedId: hit.sharedId,
    template: hit.template,
    title: hit.title,
    titleHtml: titleHit?.texts[0] || hit.title,
    ...(icon ? { icon } : {}),
    year: creationYear(hit.creationDate),
    properties,
    fullText: snippets.fullText,
    count: snippets.count,
    hasTitle: Boolean(titleHit),
    hasProperties: properties.length > 0,
    hasDocument: snippets.fullText.length > 0,
  };
};

const libraryResultViews = (rows: readonly LibrarySearchHit[]): LibraryResultView[] =>
  rows.flatMap(row => {
    const snippets = readSnippets(row);
    return snippets ? [toResultView(row, snippets)] : [];
  });

const matchTypeCounts = (views: readonly LibraryResultView[]) => ({
  title: views.filter(view => view.hasTitle).length,
  properties: views.filter(view => view.hasProperties).length,
  document: views.filter(view => view.hasDocument).length,
});

const matchesActiveTypes = (view: LibraryResultView, active: MatchTypeFilters) =>
  (active.title && view.hasTitle) ||
  (active.properties && view.hasProperties) ||
  (active.document && view.hasDocument);

const visibleLibraryResults = (views: readonly LibraryResultView[], active: MatchTypeFilters) =>
  views
    .filter(view => matchesActiveTypes(view, active))
    .map(view => ({
      ...view,
      properties: active.properties ? view.properties : [],
      fullText: active.document ? view.fullText : [],
    }));

export type { LibraryResultView, MatchType, MatchTypeFilters, PropertySnippet };
export { libraryResultViews, matchTypeCounts, visibleLibraryResults };
