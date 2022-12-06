import { actions } from 'app/BasicReducer';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import api from 'app/Search/SearchAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import rison from 'rison-node';
import { getThesaurusPropertyNames } from 'shared/commonTopicClassification';
import { setTableViewColumns } from 'app/Library/actions/libraryActions';
import { tocGenerationUtils } from 'app/ToggledFeatures/tocGeneration';
import { wrapDispatch } from 'app/Multireducer';
import { UserRole } from 'shared/types/userSchema';
import { getTableColumns } from './tableColumns';
import setReduxState from './setReduxState.js';

const decodeQuery = params => {
  try {
    return rison.decode(params.q || '()');
  } catch (error) {
    error.status = 404;
    throw error;
  }
};

const processQuery = (params, globalResources, key) => {
  const defaultSearch = prioritySortingCriteria.get({ templates: globalResources.templates });

  let query = decodeQuery(params);

  query = Object.assign(query, {
    order: query.order || defaultSearch.order,
    sort: query.sort || defaultSearch.sort,
    view: params.view,
  });

  const noDocuments = !globalResources[key] || !globalResources[key].documents?.get('rows').size;

  if (noDocuments && query.limit) {
    query = Object.assign(query, { limit: query.limit + (query.from || 0), from: 0 });
  }

  const { userSelectedSorting, ...sanitizedQuery } = query;

  const loggedIn = globalResources.user && globalResources.user.has('role');
  const isAdmin = loggedIn && globalResources.user.get('role') === UserRole.ADMIN;

  return {
    ...tocGenerationUtils.aggregations(sanitizedQuery, globalResources.settings.collection.toJS()),
    ...(loggedIn ? { aggregatePublishingStatus: true } : {}),
    ...(loggedIn && !isAdmin ? { aggregatePermissionsByLevel: true } : {}),
    ...(isAdmin ? { aggregatePermissionsByUsers: true } : {}),
  };
};

const requestState = (
  requestParams,
  globalResources,
  options = { calculateTableColumns: false, geolocation: false }
) => {
  const docsQuery = processQuery(requestParams.data, globalResources, 'library');

  const documentsRequest = requestParams.set(
    tocGenerationUtils.aggregations(docsQuery, globalResources.settings.collection.toJS())
  );

  const markersRequest = options.geolocation
    ? api.search(
        requestParams.set({
          ...docsQuery,
          geolocation: true,
        })
      )
    : { rows: [] };

  return Promise.all([api.search(documentsRequest), markersRequest]).then(
    ([documents, markers]) => {
      const templates = globalResources.templates.toJS();
      const filterState = libraryHelpers.URLQueryToState(
        documentsRequest.data,
        templates,
        globalResources.thesauris.toJS(),
        globalResources.relationTypes.toJS(),
        requestParams.data.quickLabelThesaurus
          ? getThesaurusPropertyNames(requestParams.data.quickLabelThesaurus, templates)
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

      const addinsteadOfSet = Boolean(docsQuery.from);

      const dispatchedActions = [
        setReduxState(state, 'library', addinsteadOfSet),
        actions.set('library.sidepanel.quickLabelState', {
          thesaurus: requestParams.data.quickLabelThesaurus,
          autoSave: false,
        }),
      ];
      if (options.calculateTableColumns) {
        const tableViewColumns = getTableColumns(documents, templates, documentsRequest.data.types);
        dispatchedActions.push(dispatch =>
          wrapDispatch(dispatch, 'library')(setTableViewColumns(tableViewColumns))
        );
      }
      return dispatchedActions;
    }
  );
};

export { decodeQuery, processQuery, requestState };
