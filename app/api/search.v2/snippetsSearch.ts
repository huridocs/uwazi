import { SearchQuery } from 'shared/types/SearchQueryType';
import { elastic } from 'api/search';
import { buildSnippetsQuery } from 'api/search.v2/buildQuery';
import { searchStringMethod } from 'api/search.v2/queryHelpers';
import templatesModel from 'api/templates/templates';
import propertiesHelper from 'shared/comonProperties';
import { PropertySchema } from 'shared/types/commonTypes';

interface ElasticSearchResults {
  _index: string;
  _type: string;
  _id: string;
  highlight?: { [k: string]: string[] };
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
  return fullTextSnippets;
}

function extractMetadataSnippets(hit: ElasticSearchResults) {
  return hit.highlight
    ? Object.entries(hit.highlight).map(([field, texts]) => ({
        field,
        texts,
      }))
    : [];
}

export const searchSnippets = async (_id: string, query: SearchQuery, language: string) => {
  const defaultSnippets = { count: 0, metadata: [], fullText: [] };
  if (query.filter && query.filter.searchString) {
    const templates = await templatesModel.get();
    const searchFields = propertiesHelper
      .textFields(templates)
      .map((prop: PropertySchema) => `metadata.${prop.name}.value`)
      .concat(['title', 'fullText']);
    const response = await elastic.search({
      body: await buildSnippetsQuery(_id, query, language, searchFields),
    });

    const hit = response.body.hits.hits[0];
    if (hit) {
      const metadataSnippets = extractMetadataSnippets(hit);
      const fullTextSnippets = extractFullTextSnippets(hit);
      return {
        count: metadataSnippets.length + fullTextSnippets.length,
        metadata: metadataSnippets,
        fullText: fullTextSnippets,
      };
    }
  }
  return defaultSnippets;
};
