/** @format */

export function aggregateSuggestionCount(
  templatePropsResults: Array<any>,
  modeledThesauri: Array<any>
) {
  // This processes the search results per thesaurus and stores the aggregate  number of documents to review
  templatePropsResults.forEach((tup: any) => {
    tup.forEach((perm: any) => {
      const prop = perm[0];
      const results = perm[1][1];
      console.dir(results);
      if (results.aggregations.all.hasOwnProperty(`_${prop.name}`)) {
        const { buckets } = results.aggregations.all[`_${prop.name}`];
        let soFar = 0;
        buckets.forEach((bucket: any) => {
          soFar += bucket.filtered.doc_count;
        });
        const thesaurus = modeledThesauri.find(t => t._id === prop.content);
        // NOTE: These suggestions are totaling per-value suggestions per
        // document, so certain documents with more than one suggested value
        // may be counted more than once.
        // TODO: Make document counts unique.
        if (!thesaurus.hasOwnProperty('suggestions')) {
          thesaurus.suggestions = 0;
        }
        thesaurus.suggestions += soFar;
      }
    });
  });
}
