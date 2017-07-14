import React from 'react';
import Helmet from 'react-helmet';
import rison from 'rison';

import api from 'app/Search/SearchAPI';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import {enterLibrary, setDocuments} from 'app/Library/actions/libraryActions';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import SearchButton from 'app/Library/components/SearchButton';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import {actions} from 'app/BasicReducer';
import {actions as formActions} from 'react-redux-form';
import {t} from 'app/I18N';
import {wrapDispatch} from 'app/Multireducer';

import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

export default class Library extends RouteHandler {

  static renderTools() {
    return (
      <div className="searchBox">
        <SearchButton storeKey="library"/>
      </div>
    );
  }

  static requestState(params, _query = {}, globalResources) {
    const defaultSearch = prioritySortingCriteria.get({templates: globalResources.templates});
    let query = rison.decode(_query.q || '()');
    query.order = query.order || defaultSearch.order;
    query.sort = query.sort || defaultSearch.sort;

    return api.search(query)
    .then((documents) => {
      const filterState = libraryHelpers.URLQueryToState(query, globalResources.templates.toJS(), globalResources.thesauris.toJS());
      return {
        library: {
          documents,
          filters: {documentTypes: query.types || [], properties: filterState.properties},
          aggregations: documents.aggregations,
          search: filterState.search
        }
      };
    });
  }

  setReduxState(state) {
    const dispatch = wrapDispatch(this.context.store.dispatch, 'library');
    dispatch(setDocuments(state.library.documents));
    dispatch(actions.set('aggregations', state.library.aggregations));
    dispatch(formActions.load('library.search', state.library.search));
    dispatch({type: 'SET_LIBRARY_FILTERS',
      documentTypes: state.library.filters.documentTypes,
      libraryFilters: state.library.filters.properties}
    );
  }

  componentWillMount() {
    wrapDispatch(this.context.store.dispatch, 'library')(enterLibrary());
  }

  render() {
    let query = rison.decode(this.props.location.query.q || '()');
    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Library')} />
        <main className="document-viewer with-panel">
          <DocumentsList storeKey="library"/>
        </main>
        <LibraryFilters storeKey="library"/>
        <ViewMetadataPanel storeKey="library" searchTerm={query.searchTerm}/>
        <SelectMultiplePanelContainer storeKey="library"/>
      </div>
    );
  }
}
