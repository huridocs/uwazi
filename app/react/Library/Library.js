import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { enterLibrary, unsetDocuments, zoomIn, zoomOut } from 'app/Library/actions/libraryActions';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';
import SearchButton from 'app/Library/components/SearchButton';
import requestState, { decodeQuery } from 'app/Library/helpers/requestState';
import LibraryLayout from 'app/Library/LibraryLayout';
import { wrapDispatch } from 'app/Multireducer';
import ImportProgress from 'app/Uploads/components/ImportProgress';
import React from 'react';

export default class Library extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.superComponentWillReceiveProps = super.componentWillReceiveProps;
  }

  static renderTools() {
    return (
      <React.Fragment>
        <div className="searchBox">
          <SearchButton storeKey="library" />
        </div>
        <ImportProgress />
      </React.Fragment>
    );
  }

  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources);
  }

  urlHasChanged(nextProps) {
    return nextProps.location.query.q !== this.props.location.query.q;
  }

  componentWillMount() {
    const { dispatch } = this.context.store;
    wrapDispatch(dispatch, 'library')(enterLibrary());
    this.zoomIn = () => wrapDispatch(dispatch, 'library')(zoomIn());
    this.zoomOut = () => wrapDispatch(dispatch, 'library')(zoomOut());
  }

  componentWillUnmount() {
    this.emptyState();
  }

  componentWillReceiveProps(nextProps) {
    const nextQuery = decodeQuery(nextProps.location.query);

    if (!nextQuery.offset) {
      this.emptyState();
    }

    if (this.urlHasChanged(nextProps)) {
      this.getClientState(nextProps);
    }
  }

  emptyState() {
    wrapDispatch(this.context.store.dispatch, 'library')(unsetDocuments());
    actions.set('library.sidepanel.quickLabelState', {});
  }

  render() {
    return (
      <LibraryLayout>
        <LibraryModeToggleButtons storeKey="library" zoomIn={this.zoomIn} zoomOut={this.zoomOut} />
        <DocumentsList storeKey="library" />
      </LibraryLayout>
    );
  }
}
