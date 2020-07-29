import { actions } from 'app/BasicReducer';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import api from 'app/Search/SearchAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import rison from 'rison';
import { getThesaurusPropertyNames } from 'shared/commonTopicClassification';
import { wrapDispatch } from 'app/Multireducer';
import setReduxState from './setReduxState.js';
import { SET_TABLE_VIEW_COLUMNS } from '../actions/actionTypes.js';

export function decodeQuery(params) {
  try {
    return rison.decode(params.q || '()');
  } catch (error) {
    error.status = 404;
    throw error;
  }
}

function columnsFromTemplates(templates) {
  return templates.reduce((properties, template) => {
    const propsToAdd = [];
    (template.properties || []).forEach(property => {
      if (!properties.find(columnProperty => property.name === columnProperty.name)) {
        propsToAdd.push(property);
      }
    });
    return properties.concat(propsToAdd);
  }, []);
}

function getColumns(documents, templates) {
  let columns = [];
  const queriedTemplates = documents.aggregations.all._types.buckets;
  if (queriedTemplates) {
    const templateIds = queriedTemplates
      .filter(template => template.filtered.doc_count > 0)
      .map(template => template.key);

    const templatesToProcess = templates.filter(t => templateIds.find(id => t._id === id));

    if (!templatesToProcess.length) {
      return [];
    }

    const commonColumns = [
      ...templatesToProcess[0].commonProperties,
      { label: 'Template', name: 'templateName' },
    ];
    columns = commonColumns.concat(columnsFromTemplates(templatesToProcess));
  }
  return columns;
}

export function processQuery(params, globalResources, key) {
  const defaultSearch = prioritySortingCriteria.get({ templates: globalResources.templates });

  let query = decodeQuery(params);

  query = Object.assign(query, {
    order: query.order || defaultSearch.order,
    sort: query.sort || defaultSearch.sort,
    view: params.view,
  });

  const noDocuments = !globalResources[key] || !globalResources[key].documents.get('rows').size;

  if (noDocuments && query.limit) {
    query = Object.assign(query, { limit: query.limit + (query.from || 0), from: 0 });
  }

  const { userSelectedSorting, ...sanitizedQuery } = query;
  return sanitizedQuery;
}

export default function requestState(request, globalResources, calculateTableColumns = false) {
  const docsQuery = processQuery(request.data, globalResources, 'library');
  const documentsRequest = request.set(docsQuery);
  const markersRequest = request.set({ ...docsQuery, geolocation: true });

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

      const tableViewColumns = calculateTableColumns ? getColumns(documents, templates) : [];

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
      return [
        setReduxState(state, 'library', addinsteadOfSet),
        actions.set('library.sidepanel.quickLabelState', {
          thesaurus: request.data.quickLabelThesaurus,
          autoSave: false,
        }),
        dispatch =>
          wrapDispatch(
            dispatch,
            'library'
          )({ type: SET_TABLE_VIEW_COLUMNS, columns: tableViewColumns }),
      ];
    }
  );
}
