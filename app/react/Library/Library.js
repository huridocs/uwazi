import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { enterLibrary, unsetDocuments, zoomIn, zoomOut } from 'app/Library/actions/libraryActions';
import DocumentsList from 'app/Library/components/DocumentsList';
import { requestState } from 'app/Library/helpers/requestState';
import LibraryLayout from 'app/Library/LibraryLayout';
import { wrapDispatch } from 'app/Multireducer';
import { withRouter } from 'app/componentWrappers';
import { trackPage } from 'app/App/GoogleAnalytics';

class Library extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.superComponentWillReceiveProps = super.componentWillReceiveProps;

    const { dispatch } = context.store;
    wrapDispatch(dispatch, 'library')(enterLibrary());
    this.zoomIn = () => wrapDispatch(dispatch, 'library')(zoomIn());
    this.zoomOut = () => wrapDispatch(dispatch, 'library')(zoomOut());
    this.scrollCallback = this.scrollCallback.bind(this);
    this.state = { scrollCount: 0 };
  }

  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources);
  }

  urlHasChanged(nextProps) {
    const nextSearchParams = new URLSearchParams(nextProps.location.search);
    const currentSearchParams = new URLSearchParams(this.props.location.search);
    return nextSearchParams.get('q') !== currentSearchParams.get('q');
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

  scrollCallback(event) {
    if (event.target.className.includes('document-viewer')) {
      this.setState((prevState, _props) => ({
        scrollCount: prevState.scrollCount + 1,
      }));
    }
  }

  render() {
    trackPage();
    return (
      <LibraryLayout
        sidePanelMode={this.props.sidePanelMode}
        scrollCallback={this.scrollCallback}
        scrollCount={this.state.scrollCount}
      >
        <DocumentsList
          storeKey="library"
          CollectionViewer={this.props.viewer}
          zoomIn={this.zoomIn}
          zoomOut={this.zoomOut}
          scrollCount={this.state.scrollCount}
        />
      </LibraryLayout>
    );
  }
}

const SSRLibrary = withRouter(Library);

export const LibraryCards = Object.assign(SSRLibrary, { requestState: Library.requestState });
export default Library;
