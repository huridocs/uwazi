import { actions } from '#app/BasicReducer/index.js';
import libraryHelpers from '#app/Library/helpers/libraryFilters.js';
import api from '#app/Search/SearchAPI.js';
import prioritySortingCriteria from '#app/utils/prioritySortingCriteria.js';
import { risonDecodeOrIgnore } from '#app/utils/index.js';
import { getThesaurusPropertyNames } from '#shared/commonTopicClassification.js';
import { setTableViewColumns } from '#app/Library/actions/libraryActions.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import { UserRole } from '#shared/types/userSchema.js';
import { getTableColumns } from '#app/Library/helpers/tableColumns.js';
import setReduxState from '#app/Library/helpers/setReduxState.js';
import { tocGenerationUtils } from '#app/ToggledFeatures/tocGeneration/utils.js';

const decodeQuery = params => {
  try {
    return risonDecodeOrIgnore(params.q || '()');
  } catch (error) {
    // if (error instanceof RangeError) {
    //   console.log()
    return {};
    // }
    // error.status = 404;
    // throw error;
  }
};

const processQuery = (params, globalResources, key) => {
  const defaultSearch = prioritySortingCriteria.get({ templates: globalResources.templates });

  let query = decodeQuery(params);

  query = Object.assign(query, {
    order: query.order || defaultSearch.order,
    sort:
      query.sort && (query.sort !== '_score' || query.searchTerm) ? query.sort : defaultSearch.sort,
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
      const useDefaultPublishedStatus =
        !documentsRequest.data.includeUnpublished && !documentsRequest.data.unpublished;
      const templates = globalResources.templates.toJS();
      const filterState = libraryHelpers.URLQueryToState(
        {
          ...documentsRequest.data,
          ...(useDefaultPublishedStatus && { includeUnpublished: false, unpublished: false }),
        },
        templates,
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
