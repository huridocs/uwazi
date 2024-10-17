import { SearchQuery } from 'shared/types/SearchQueryType';
import { ElasticHit, SearchResponse } from 'api/search/elasticTypes';
import { EntitySchema } from 'shared/types/entityType';

function getSnippetsForNonFullText(hit: ElasticHit<EntitySchema>) {
  return hit.highlight
    ? Object.entries(hit.highlight).reduce<any>((memo, [property, highlights]: [any, any]) => {
        memo.push({ field: property, texts: highlights });
        return memo;
      }, [])
    : [];
}

function extractFullTextSnippets(hit: ElasticHit<EntitySchema>) {
  const fullTextSnippets: { text: string; page: number; filename: string }[] = [];

  if (hit.inner_hits && hit.inner_hits.fullText.hits.hits[0]?.highlight) {
    const { highlight, _source } = hit.inner_hits.fullText.hits.hits[0];
    const regex = /\[{2}(\d+)]{2}/g;

    Object.values<string[]>(highlight).forEach(snippets => {
      snippets.forEach(snippet => {
        const matches = regex.exec(snippet);
        fullTextSnippets.push({
          text: snippet.replace(regex, ''),
          page: matches ? Number(matches[1]) : 0,
          filename: _source.filename,
        });
      });
    });
  }

  const hitsCount = hit.highlight
    ? Object.values(hit.highlight).reduce<number>(
        (memo, highlights: any) => memo + highlights.length,
        0
      )
    : 0;

  return {
    count: fullTextSnippets.length + hitsCount,
    metadata: getSnippetsForNonFullText(hit),
    fullText: fullTextSnippets,
  };
}

export const mapResults = (entityResults: SearchResponse<EntitySchema>, searchQuery: SearchQuery) =>
  entityResults.hits.hits.map(entityResult => {
    const entity = entityResult._source;
    entity._id = entityResult._id;
    if (searchQuery.fields && searchQuery.fields.includes('snippets')) {
      entity.snippets = extractFullTextSnippets(entityResult);
    }
    return entity;
  });
