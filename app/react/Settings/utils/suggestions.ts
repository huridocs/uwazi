import { PropertySchema } from 'shared/types/commonTypes';

function getSuggestionsQuery(
  templateProperty: PropertySchema,
  templateID: string,
  includeUnpublished: boolean,
  unpublishedOnly: boolean
) {
  const query = {
    select: ['sharedId'],
    limit: 1,
    filters: {},
    includeUnpublished,
    unpublished: unpublishedOnly,
    types: [templateID],
  };
  const { name } = templateProperty;
  if (name === undefined) {
    return null;
  }
  const filters: any = {
    [name]: {
      values: unpublishedOnly ? ['any'] : ['missing'],
    },
    [`_${name}`]: {
      values: ['any'],
    },
  };
  query.filters = filters;
  return query;
}

export function getReadyToReviewSuggestionsQuery(
  matchingTemplateProperty: any,
  templateID: string
) {
  if (!matchingTemplateProperty) {
    return {};
  }
  return getSuggestionsQuery(matchingTemplateProperty, templateID, true, false);
}

export function getReadyToPublishSuggestionsQuery(
  matchingTemplateProperty: any,
  templateID: string
) {
  if (!matchingTemplateProperty) {
    return {};
  }
  return getSuggestionsQuery(matchingTemplateProperty, templateID, false, true);
}
