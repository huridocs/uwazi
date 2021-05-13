interface ElasticSearchResults {
  _index: string;
  _type: string;
  _id: string;
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

export const extractSnippets = (hits: { hits: ElasticSearchResults[] }) => {
  const defaultSnippets = { count: 0, metadata: [], fullText: [] };
  if (hits.hits[0]) {
    const fullTextSnippets = extractFullTextSnippets(hits.hits[0]);
    return {
      count: fullTextSnippets.length,
      metadata: [],
      fullText: fullTextSnippets,
    };
  }
  return defaultSnippets;
};
