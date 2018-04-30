import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import rison from 'rison';
import api from 'app/Search/SearchAPI';
import libraryHelpers from 'app/Library/helpers/libraryFilters';

export default function requestState(params, _query = {}, globalResources, key = 'documents') {
  const defaultSearch = prioritySortingCriteria.get({ templates: globalResources.templates });
  const query = rison.decode(_query.q || '()');
  query.order = query.order || defaultSearch.order;
  query.sort = query.sort || defaultSearch.sort;
  query.view = _query.view;

  if (key === 'markers') {
    query.geolocation = true;
  }

  return api.search(query)
  .then((response) => {
    const filterState = libraryHelpers.URLQueryToState(query, globalResources.templates.toJS(), globalResources.thesauris.toJS());
    const state = {
      library: {
        filters: { documentTypes: query.types || [], properties: filterState.properties },
        aggregations: response.aggregations,
        search: filterState.search,
        documents: { rows: [] },
        markers: { rows: [] }
      }
    };
    state.library[key] = response;
    return state;
  });
}
