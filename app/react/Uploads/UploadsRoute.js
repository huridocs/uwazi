import React from 'react';
import { Helmet } from 'react-helmet';
import RouteHandler from 'app/App/RouteHandler';
import LibraryCharts from 'app/Charts/components/LibraryCharts';
import { t } from 'app/I18N';
import { enterLibrary, unsetDocuments } from 'app/Library/actions/libraryActions';
import { processQuery } from 'app/Library/helpers/requestState';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import SearchBar from 'app/Library/components/SearchBar';
import SearchButton from 'app/Library/components/SearchButton';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import { wrapDispatch } from 'app/Multireducer';
import api from 'app/Search/SearchAPI';
import ImportPanel from 'app/Uploads/components/ImportPanel';
import UploadBox from 'app/Uploads/components/UploadBox';
import UploadsHeader from 'app/Uploads/components/UploadsHeader';

import setReduxState from 'app/Library/helpers/setReduxState';
import rison from 'rison-node';
import { socket } from '../socket';

export default class Uploads extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.refreshSearch = this.refreshSearch.bind(this);
  }

  static renderTools() {
    return (
      <div className="searchBox">
        <SearchButton storeKey="uploads" />
      </div>
    );
  }

  urlHasChanged(nextProps) {
    return nextProps.location.query.q !== this.props.location.query.q;
  }

  emptyState() {
    wrapDispatch(this.context.store.dispatch, 'uploads')(unsetDocuments());
  }

  static async requestState(requestParams, globalResources) {
    const query = processQuery(requestParams.data, globalResources, 'uploads');
    query.unpublished = true;

    const documents = await api.search(requestParams.set(query));
    const filterState = libraryHelpers.URLQueryToState(
      query,
      globalResources.templates.toJS(),
      globalResources.relationTypes.toJS()
    );

    const addinsteadOfSet = Boolean(query.from);

    return [
      setReduxState(
        {
          uploads: {
            documents,
            filters: {
              documentTypes: query.types || [],
              properties: filterState.properties,
            },
            aggregations: documents.aggregations,
            search: filterState.search,
          },
        },
        'uploads',
        addinsteadOfSet
      ),
    ];
  }

  refreshSearch() {
    super.getClientState(this.props);
  }

  componentDidMount() {
    const dispatch = wrapDispatch(this.context.store.dispatch, 'uploads');
    socket.on('IMPORT_CSV_END', this.refreshSearch);
    dispatch(enterLibrary());
  }

  componentWillUnmount() {
    socket.removeListener('IMPORT_CSV_END', this.refreshSearch);
    this.emptyState();
  }

  componentDidUpdate(prevProps) {
    if (this.urlHasChanged(prevProps)) {
      this.getClientState(this.props);
    }
  }

  render() {
    const query = rison.decode(this.props.location.query.q || '()');
    const chartView = this.props.location.query.view === 'chart';
    const mainView = !chartView ? (
      <DocumentsList storeKey="uploads" SearchBar={SearchBar} />
    ) : (
      <LibraryCharts storeKey="uploads" />
    );

    return (
      <div className="row panels-layout">
        <Helmet>
          <title>{t('System', 'Uploads', null, false)}</title>
        </Helmet>
        <UploadsHeader />
        <div className="content-holder uploads-viewer document-viewer with-panel with-header">
          <main>
            <UploadBox />
            {/*<ListChartToggleButtons active={chartView ? 'chart' : 'list'} />*/}
            {mainView}
          </main>
          <LibraryFilters uploadsSection storeKey="uploads" />
          <ViewMetadataPanel storeKey="uploads" searchTerm={query.searchTerm} />
          <SelectMultiplePanelContainer storeKey="uploads" />
          <ImportPanel />
        </div>
      </div>
    );
  }
}
