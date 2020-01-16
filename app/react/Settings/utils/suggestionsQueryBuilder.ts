/** @format */

export function getSuggestionsQuery(matchingTemplateProperty, templateID) {
  const query = {
    select: ['sharedId'],
    limit: 1,
    filters: {},
    unpublished: true,
    types: [templateID],
  };
  const { name } = matchingTemplateProperty;
  const filters = {};
  filters[name] = {
    values: ['missing'],
  };
  filters[`_${name}`] = {
    values: ['any'],
  };
  query.filters = filters;
  return query;
}
