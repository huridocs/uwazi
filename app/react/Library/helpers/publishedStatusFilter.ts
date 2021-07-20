interface FilterToQueryParams {
  publishedStatus?: { values: string[] };
  includeUnpublished?: boolean;
  unpublished?: boolean;
}

export const filterToQuery = (search: FilterToQueryParams) => {
  const filteredQuery: FilterToQueryParams = { ...search };
  const published = filteredQuery.publishedStatus!.values.includes('published');
  const restricted = filteredQuery.publishedStatus!.values.includes('restricted');

  filteredQuery.includeUnpublished = published === restricted;
  filteredQuery.unpublished = !published && restricted;

  delete filteredQuery.publishedStatus;

  return filteredQuery;
};

export const queryToFilter = (unpublished: boolean, includeUnpublished: boolean) => ({
  values: [
    ...(!unpublished ? ['published'] : []),
    ...((!includeUnpublished && unpublished) || (includeUnpublished && !unpublished)
      ? ['restricted']
      : []),
  ],
});
