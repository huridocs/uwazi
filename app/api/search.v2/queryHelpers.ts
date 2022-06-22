import { elastic } from 'api/search';
import { SearchQuery } from 'shared/types/SearchQueryType';

export const cleanUp = (value: any) => value;

const searchStringMethod = async (searchString: string) => {
  const validationResult = await elastic.indices.validateQuery({
    body: { query: { query_string: { query: searchString } } },
  });
  return validationResult.body.valid ? 'query_string' : 'simple_query_string';
};

const FULLTEXTGROUP_MATCH_REGEX = /fullText:\(\s*[^,)]*\)/g;
const FULLTEXTGROUP_CAPTURE_REGEX = /fullText:\(\s*([^,)]*)\)/;

const extractFullTextGroups = (searchString: string) => {
  const fullTextGroups = searchString.match(FULLTEXTGROUP_MATCH_REGEX) || [];
  return fullTextGroups.map(s => s.match(FULLTEXTGROUP_CAPTURE_REGEX)).map(r => (r ? r[1] : ''));
};

// eslint-disable-next-line max-statements
async function extractSearchParams(query: SearchQuery): Promise<{
  fullText?: {
    string?: string;
    method: string;
  };
  search?: {
    string?: string;
    method: string;
  };
}> {
  if (query.filter && query.filter.searchString && typeof query.filter.searchString === 'string') {
    const { searchString } = query.filter;
    const fullTextGroups = extractFullTextGroups(searchString);

    if (fullTextGroups.length) {
      const fullTextSearchString = fullTextGroups.join(' ');
      return {
        fullText: {
          string: fullTextSearchString,
          method: await searchStringMethod(fullTextSearchString),
        },
      };
    }

    const searchMethod = await searchStringMethod(searchString);
    return {
      search: {
        string: searchString,
        method: searchMethod,
      },
      fullText: {
        string: searchString,
        method: searchMethod,
      },
    };
  }
  return {
    search: {
      string: query.filter?.searchString,
      method: 'query_string',
    },
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
