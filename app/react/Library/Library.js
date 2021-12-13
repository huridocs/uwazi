import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { enterLibrary, unsetDocuments, zoomIn, zoomOut } from 'app/Library/actions/libraryActions';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';
import { requestState } from 'app/Library/helpers/requestState';
import LibraryLayout from 'app/Library/LibraryLayout';
import { wrapDispatch } from 'app/Multireducer';
import React from 'react';
import { TableViewer } from 'app/Layout/TableViewer';

export default class Library extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.superComponentWillReceiveProps = super.componentWillReceiveProps;

    const { dispatch } = context.store;
    wrapDispatch(dispatch, 'library')(enterLibrary());
    this.zoomIn = () => wrapDispatch(dispatch, 'library')(zoomIn());
    this.zoomOut = () => wrapDispatch(dispatch, 'library')(zoomOut());
  }

  static renderTools() {}

  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources);
  }

  urlHasChanged(nextProps) {
    return nextProps.location.query.q !== this.props.location.query.q;
  }

  componentWillUnmount() {
    this.emptyState();
  }

  componentDidUpdate(prevProps) {
    if (this.urlHasChanged(prevProps)) {
      this.getClientState(this.props);
    }
  }

  emptyState() {
    wrapDispatch(this.context.store.dispatch, 'library')(unsetDocuments());
    actions.set('library.sidepanel.quickLabelState', {});
  }

  render() {
    const tableViewMode = this.props.viewer === TableViewer;
    return (
      <LibraryLayout
        sidePanelMode={this.props.sidePanelMode}
        noScrollable={this.props.noScrollable}
      >
        <LibraryModeToggleButtons
          storeKey="library"
          zoomIn={this.zoomIn}
          zoomOut={this.zoomOut}
          tableViewMode={tableViewMode}
        />
        <DocumentsList storeKey="library" CollectionViewer={this.props.viewer} />
      </LibraryLayout>
    );
  }
}
