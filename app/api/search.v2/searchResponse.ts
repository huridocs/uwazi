import { EntitySchema } from 'shared/types/entityType';
import { SearchQuery } from 'shared/types/SearchQueryType';

interface ElasticSearchResults {
  _index: string;
  _type: string;
  _id: string;
  _source: EntitySchema;
  // eslint-disable-next-line camelcase
  inner_hits?: { fullText: { hits: { hits: [{ highlight: {} }] } } };
}

function extractFullTextSnippets(hit: ElasticSearchResults) {
  const fullTextSnippets: { text: string; page: number }[] = [];

  if (hit.inner_hits && hit.inner_hits.fullText.hits.hits.length > 0) {
    const { highlight } = hit.inner_hits.fullText.hits.hits[0];
    const regex = /\[{2}(\d+)]{2}/g;

    Object.values<string[]>(highlight).forEach(snippets => {
      snippets.forEach(snippet => {
        const matches = regex.exec(snippet);
        fullTextSnippets.push({
          text: snippet.replace(regex, ''),
          page: matches ? Number(matches[1]) : 0,
        });
      });
    });
  }
  return { count: fullTextSnippets.length, metadata: [], fullText: fullTextSnippets };
}

export const mapResults = (entityResults: ElasticSearchResults[], searchQuery: SearchQuery) =>
  entityResults.map(entityResult => {
    const entity = entityResult._source;
    entity._id = entityResult._id;
    if (searchQuery.fields && searchQuery.fields.includes('snippets')) {
      entity.snippets = extractFullTextSnippets(entityResult);
    }
    return entity;
  });
