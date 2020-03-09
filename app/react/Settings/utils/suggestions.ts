import { PropertySchema } from 'shared/types/commonTypes';

function baseQuery(templateID: string, includeUnpublished: boolean, unpublishedOnly: boolean) {
  const query = {
    select: ['sharedId'],
    limit: 1,
    filters: {},
    includeUnpublished,
    unpublished: unpublishedOnly,
    types: [templateID],
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
      [`_${name}`]: {
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
      [`_${name}`]: {
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
      }
    },
  };
}
