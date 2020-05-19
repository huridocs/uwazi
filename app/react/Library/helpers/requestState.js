import { actions } from 'app/BasicReducer';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import api from 'app/Search/SearchAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import rison from 'rison';
import { getThesaurusPropertyNames } from 'shared/commonTopicClassification';
import setReduxState from './setReduxState.js';

export function decodeQuery(params) {
  try {
    return rison.decode(params.q || '()');
  } catch (error) {
    error.status = 404;
    throw error;
  }
}

export function processQuery(params, globalResources, key) {
  const defaultSearch = prioritySortingCriteria.get({ templates: globalResources.templates });

  let query = decodeQuery(params);
  query.order = query.order || defaultSearch.order;
  query.sort = query.sort || defaultSearch.sort;
  query.view = params.view;

  if (!globalResources.library && query.limit) {
    console.log(query.limit, query.offset || 0);

    query = Object.assign(query, { limit: query.limit + (query.offset || 0), offset: 0 });
  }

  query.geolocation = key === 'markers';

  const { userSelectedSorting, ...sanitizedQuery } = query;
  return sanitizedQuery;
}

export default function requestState(request, globalResources) {
  const docsQuery = processQuery(request.data, globalResources);
  const documentsRequest = request.set(docsQuery);
  const markersRequest = request.set(processQuery(request.data, globalResources, 'markers'));

  return Promise.all([api.search(documentsRequest), api.search(markersRequest)]).then(
    ([documents, markers]) => {
      const templates = globalResources.templates.toJS();
      const filterState = libraryHelpers.URLQueryToState(
        documentsRequest.data,
        templates,
        globalResources.thesauris.toJS(),
        globalResources.relationTypes.toJS(),
        request.data.quickLabelThesaurus
          ? getThesaurusPropertyNames(request.data.quickLabelThesaurus, templates)
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

      const replaceOrAddEntities = Boolean(docsQuery.offset);
      return [
        setReduxState(state, replaceOrAddEntities),
        actions.set('library.sidepanel.quickLabelState', {
          thesaurus: request.data.quickLabelThesaurus,
          autoSave: false,
        }),
      ];
    }
  );
}
