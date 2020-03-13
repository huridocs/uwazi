import { actions } from 'app/BasicReducer';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import api from 'app/Search/SearchAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import rison from 'rison';
import { getThesaurusPropertyNames } from 'shared/commonTopicClassification';
import setReduxState from './setReduxState.js';

export function processQuery(_query, globalResources, key) {
  const defaultSearch = prioritySortingCriteria.get({ templates: globalResources.templates });

  let query;
  try {
    query = rison.decode(_query.q || '()');
  } catch (error) {
    error.status = 404;
    throw error;
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

export default function requestState(request, globalResources) {
  const documentsRequest = request.set(processQuery(request.data, globalResources));
  const markersRequest = request.set(processQuery(request.data, globalResources, 'markers'));

  return Promise.all([api.search(documentsRequest), api.search(markersRequest)]).then(
    ([documents, markers]) => {
      const templates = globalResources.templates.toJS();
      const filterState = libraryHelpers.URLQueryToState(
        documentsRequest.data,
        templates,
        globalResources.thesauris.toJS(),
        globalResources.relationTypes.toJS(),
        request.data.multiEditThesaurus
          ? getThesaurusPropertyNames(request.data.multiEditThesaurus, templates)
          : []
      );
      const state = {
        library: {
          filters: {
            documentTypes: documentsRequest.data.types || [],
            properties: filterState.properties,
          },
          aggregations: documents.aggregations,
          search: filterState.search,
          documents,
          markers,
        },
      };

      return [
        setReduxState(state),
        actions.set('library.sidepanel.multiEditOpts', {
          thesaurus: request.data.multiEditThesaurus,
          autoSave: true,
        }),
      ];
    }
  );
}
