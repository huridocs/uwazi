/** @format */

export function getSuggestionsQuery(matchingTemplateProperty: any, templateID: string) {
  const query = {
    select: ['sharedId'],
    limit: 1,
    filters: {},
    includeUnpublished: true,
    types: [templateID],
  };
  const { name } = matchingTemplateProperty;
  const filters: any = {};
  filters[name] = {
    values: ['missing'],
  };
  filters[`_${name}`] = {
    values: ['any'],
  };
  query.filters = filters;
  return query;
}
