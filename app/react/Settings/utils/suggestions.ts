/** @format */

export function getReadyToReviewSuggestionsQuery(
  matchingTemplateProperty: any,
  templateID: string
) {
  if (!matchingTemplateProperty) {
    return {};
  }
  const query = {
    select: ['sharedId'],
    limit: 1,
    filters: {},
    includeUnpublished: true,
    types: [templateID],
  };
  const { name } = matchingTemplateProperty;
  const filters: any = {
    [name]: {
      values: ['missing'],
    },
    [`_${name}`]: {
      values: ['any'],
    },
  };
  query.filters = filters;
  return query;
}

export function getReadyToPublishSuggestionsQuery(
  matchingTemplateProperty: any,
  templateID: string
) {
  if (!matchingTemplateProperty) {
    return {};
  }
  const query = {
    select: ['sharedId'],
    limit: 1,
    filters: {},
    unpublished: true,
    types: [templateID],
  };
  const { name } = matchingTemplateProperty;
  const filters: any = {};
  filters[name] = {
    values: ['any'],
  };
  filters[`_${name}`] = {
    values: ['any'],
  };
  query.filters = filters;
  return query;
}
