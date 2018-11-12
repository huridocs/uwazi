import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import rison from 'rison';
import api from 'app/Search/SearchAPI';
import libraryHelpers from 'app/Library/helpers/libraryFilters';

function processQuery(_query, globalResources, key) {
  const defaultSearch = prioritySortingCriteria.get({ templates: globalResources.templates });

  let query;
  try {
    query = rison.decode(_query.q || '()');
  } catch (error) {
    error.status = 404;
    throw (error);
  }

  query.order = query.order || defaultSearch.order;
  query.sort = query.sort || defaultSearch.sort;
  query.view = _query.view;

  if (key === 'markers') {
    query.geolocation = true;
  }
  const { userSelectedSorting, ...sanitizedQuery } = query;
  return sanitizedQuery;
}

export default function requestState(params, _query = {}, globalResources) {
  const documentsQuery = processQuery(_query, globalResources);
  const markersQuery = processQuery(_query, globalResources, 'markers');

  return Promise.all([api.search(documentsQuery), api.search(markersQuery)])
  .then(([documents, markers]) => {
    const filterState = libraryHelpers.URLQueryToState(
      documentsQuery,
      globalResources.templates.toJS(),
      globalResources.thesauris.toJS(),
      globalResources.relationTypes.toJS()
    );
    const state = {
      library: {
        filters: { documentTypes: documentsQuery.types || [], properties: filterState.properties },
        aggregations: documents.aggregations,
        search: filterState.search,
        documents,
        markers
      }
    };
    return state;
  });
}
