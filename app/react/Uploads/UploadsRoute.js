import React from 'react';
import Helmet from 'react-helmet';
import rison from 'rison';

import api from 'app/Search/SearchAPI';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryCharts from 'app/Charts/components/LibraryCharts';
import LibraryFilters from 'app/Library/components/LibraryFilters';
// import ListChartToggleButtons from 'app/Charts/components/ListChartToggleButtons';
import { enterLibrary, setDocuments } from 'app/Library/actions/libraryActions';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import SearchButton from 'app/Library/components/SearchButton';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import { actions } from 'app/BasicReducer';
import { actions as formActions } from 'react-redux-form';
import { t } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';

import UploadBox from 'app/Uploads/components/UploadBox';
import UploadsHeader from 'app/Uploads/components/UploadsHeader';
import ImportPanel from 'app/Uploads/components/ImportPanel';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import socket from '../socket';


export default class Uploads extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.superComponentWillReceiveProps = super.componentWillReceiveProps;
    this.refreshSearch = this.refreshSearch.bind(this);
  }

  static renderTools() {
    return (
      <div className="searchBox">
        <SearchButton storeKey="uploads"/>
      </div>
    );
  }

  urlHasChanged(nextProps) {
    return nextProps.location.query.q !== this.props.location.query.q;
  }

  static requestState(params, _query = {}, globalResources) {
    const defaultSearch = prioritySortingCriteria.get({ templates: globalResources.templates });
    const query = rison.decode(_query.q || '()');
    query.order = query.order || defaultSearch.order;
    query.sort = query.sort || defaultSearch.sort;
    query.unpublished = true;

    return api.search(query)
    .then((documents) => {
      const filterState = libraryHelpers.URLQueryToState(
        query,
        globalResources.templates.toJS(),
        globalResources.thesauris.toJS(),
        globalResources.relationTypes.toJS()
      );
      return {
        uploads: {
          documents,
          filters: { documentTypes: query.types || [], properties: filterState.properties },
          aggregations: documents.aggregations,
          search: filterState.search
        }
      };
    });
  }

  setReduxState(state) {
    const dispatch = wrapDispatch(this.context.store.dispatch, 'uploads');
    dispatch(setDocuments(state.uploads.documents));
    dispatch(actions.set('aggregations', state.uploads.aggregations));
    dispatch(formActions.load('uploads.search', state.uploads.search));
    dispatch({ type: 'SET_LIBRARY_FILTERS',
                                documentTypes: state.uploads.filters.documentTypes,
                                libraryFilters: state.uploads.filters.properties }
    );
  }

  refreshSearch() {
    super.getClientState();
  }

  componentDidMount() {
    const dispatch = wrapDispatch(this.context.store.dispatch, 'uploads');
    socket.on('IMPORT_CSV_END', this.refreshSearch);
    dispatch(enterLibrary());
  }

  componentWillUnmount() {
    socket.removeListener('IMPORT_CSV_END', this.refreshSearch);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.query.q !== this.props.location.query.q) {
      return this.superComponentWillReceiveProps(nextProps);
    }
  }

  render() {
    const query = rison.decode(this.props.location.query.q || '()');
    const chartView = this.props.location.query.view === 'chart';
    const mainView = !chartView ? <DocumentsList storeKey="uploads"/> : <LibraryCharts storeKey="uploads" />;

    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Uploads', null, false)} />
        <UploadsHeader/>
        <main className="uploads-viewer document-viewer with-panel">
          <UploadBox />
          {/*<ListChartToggleButtons active={chartView ? 'chart' : 'list'} />*/}
          {mainView}
        </main>
        <LibraryFilters uploadsSection storeKey="uploads"/>
        <ViewMetadataPanel storeKey="uploads" searchTerm={query.searchTerm}/>
        <SelectMultiplePanelContainer storeKey="uploads"/>
        <ImportPanel/>
      </div>
    );
  }
}
