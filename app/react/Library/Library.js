import React from 'react';
import Helmet from 'react-helmet';
import rison from 'rison';

import api from 'app/Search/SearchAPI';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryCharts from 'app/Charts/components/LibraryCharts';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import ListChartToggleButtons from 'app/Charts/components/ListChartToggleButtons';
import {enterLibrary, setDocuments, unsetDocuments, initializeFiltersForm} from 'app/Library/actions/libraryActions';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import SearchButton from 'app/Library/components/SearchButton';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import {actions as formActions} from 'react-redux-form';
import {t} from 'app/I18N';
import {wrapDispatch} from 'app/Multireducer';

import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

export default class Library extends RouteHandler {

  constructor(props, context) {
    super(props, context);
    this.superComponentWillReceiveProps = super.componentWillReceiveProps;
  }

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
    dispatch(unsetDocuments());
    dispatch(formActions.load('library.search', state.library.search));

    dispatch(initializeFiltersForm({
      documentTypes: state.library.filters.documentTypes,
      libraryFilters: state.library.filters.properties,
      aggregations: state.library.aggregations
    }));

    dispatch(setDocuments(state.library.documents));
  }

  componentWillMount() {
    wrapDispatch(this.context.store.dispatch, 'library')(enterLibrary());
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.query.q !== this.props.location.query.q) {
      return this.superComponentWillReceiveProps(nextProps);
    }
  }

  render() {
    let query = rison.decode(this.props.location.query.q || '()');
    const chartView = this.props.location.query.view === 'chart';
    const mainView = !chartView ? <DocumentsList storeKey="library"/> : <LibraryCharts storeKey="library" />;

    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Library')} />
        <main className="library-viewer document-viewer with-panel">
          <ListChartToggleButtons active={chartView ? 'chart' : 'list'} />
          <div className="blank-state">
            <i className="fa fa-search"></i>
            <h4>No Results</h4>
            <p>We have look everywhere, but couldn’t find any result to show here.</p>
            <a href="#" target="_blank">Learn more</a>
          </div>
          {mainView}
        </main>
        <LibraryFilters storeKey="library"/>
        <ViewMetadataPanel storeKey="library" searchTerm={query.searchTerm}/>
        <SelectMultiplePanelContainer storeKey="library"/>
      </div>
    );
  }
}
