import { elastic } from 'api/search';
import { SearchQuery } from 'shared/types/SearchQueryType';

export const cleanUp = (value: any) => value;

const searchStringMethod = async (searchString: string) => {
  const validationResult = await elastic.indices.validateQuery({
    body: { query: { query_string: { query: searchString } } },
  });
  return validationResult.body.valid ? 'query_string' : 'simple_query_string';
};

async function extractSearchParams(
  query: SearchQuery
): Promise<{
  searchString?: string;
  fullTextSearchString?: string;
  searchMethod: string;
}> {
  if (query.filter && query.filter.searchString && typeof query.filter.searchString === 'string') {
    let { searchString } = query.filter;
    let searchTypeKey = 'searchString';
    const fullTextGroups = /fullText:\(\s*([^,]*)\)/g.exec(searchString) || [''];

    if (fullTextGroups.length > 1) {
      searchString = fullTextGroups[1].replace(fullTextGroups[0], '');
      searchTypeKey = 'fullTextSearchString';
    }

    const searchMethod = await searchStringMethod(searchString);
    return { [searchTypeKey]: searchString, searchMethod };
  }
  return {
    searchString: query.filter?.searchString,
    searchMethod: 'query_string',
  };
}

function snippetsHighlight(query: SearchQuery) {
  const snippets = query.fields && query.fields.includes('snippets');
  return snippets
    ? {
        highlight: {
          order: 'score',
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
          encoder: 'html',
          number_of_fragments: 9999,
          type: 'fvh',
          fragment_size: 300,
          fragmenter: 'span',
          fields: {
            'fullText_*': {},
          },
        },
      }
    : {};
}

export { extractSearchParams, snippetsHighlight };
