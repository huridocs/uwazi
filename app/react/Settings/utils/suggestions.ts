import { PropertySchema } from 'shared/types/commonTypes';

function baseQuery(templateID: string, includeUnpublished: boolean, unpublishedOnly: boolean) {
  const query = {
    select: ['sharedId'],
    limit: 1,
    filters: {},
    includeUnpublished,
    unpublished: unpublishedOnly,
    allAggregations: true,
    types: [templateID],
    includeReviewAggregations: true,
  };
  return query;
}

export function getReadyToReviewSuggestionsQuery(
  templateID: string,
  templateProperty: PropertySchema
) {
  if (!templateProperty || !templateProperty.name) {
    return null;
  }
  const { name } = templateProperty;
  return {
    ...baseQuery(templateID, true, false),
    filters: {
      [name]: {
        values: ['missing'],
      },
      [`__${name}`]: {
        values: ['any'],
      },
    },
  };
}

export function getReadyToPublishSuggestionsQuery(
  templateID: string,
  templateProperty: PropertySchema
) {
  if (!templateProperty || !templateProperty.name) {
    return null;
  }
  const { name } = templateProperty;
  return {
    ...baseQuery(templateID, false, true),
    filters: {
      [name]: {
        values: ['any'],
      },
      [`__${name}`]: {
        values: ['any'],
      },
    },
  };
}

export function getLabelsQuery(templateID: string, templateProperty: PropertySchema) {
  if (!templateProperty || !templateProperty.name) {
    return null;
  }
  const { name } = templateProperty;
  return {
    ...baseQuery(templateID, true, false),
    filters: {
      [name]: {
        values: ['any'],
      },
    },
  };
}
