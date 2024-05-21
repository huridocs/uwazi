import React from 'react';
import { actions as formActions } from 'react-redux-form';
import { withRouter } from 'app/componentWrappers';
import RouteHandler from 'app/App/RouteHandler';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import { actions } from 'app/BasicReducer';
import * as relationships from 'app/Relationships/utils/routeUtils';
import { showTab } from 'app/Entities/actions/uiActions';
import { trackPage } from 'app/App/GoogleAnalytics';
import { ErrorBoundary } from 'app/V2/Components/ErrorHandling';
import { PDFViewComponent } from './PDFView';
import EntityView from './EntityView';
import { ViewerComponent } from './components/ViewerComponent';
import { setReferences } from './actions/referencesActions';

class ViewerRouteComponent extends RouteHandler {
  static async requestState(requestParams, globalResources) {
    const { sharedId } = requestParams.data;
    const [entity] = await EntitiesAPI.get(
      requestParams.set({ sharedId, omitRelationships: true })
    );
    return entity.documents.length
      ? PDFViewComponent.requestState(requestParams, globalResources)
      : EntityView.requestState(requestParams, globalResources);
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.context.store.dispatch(actions.unset('viewer/doc'));
    this.context.store.dispatch(actions.unset('viewer/templates'));
    this.context.store.dispatch(actions.unset('viewer/thesauris'));
    this.context.store.dispatch(actions.unset('viewer/relationTypes'));
    this.context.store.dispatch(actions.unset('viewer/rawText'));
    this.context.store.dispatch(formActions.reset('documentViewer.tocForm'));
    this.context.store.dispatch(actions.unset('viewer/targetDoc'));
    this.context.store.dispatch(setReferences([]));
    this.context.store.dispatch(actions.unset('entityView/entity'));
    this.context.store.dispatch(relationships.emptyState());
  }

  urlHasChanged(nextProps) {
    const { sharedId: oldSharedId, lang: oldLang } = nextProps.params;
    const { sharedId: newSharedId, lang: newLang } = this.props.params;
    const file = new URLSearchParams(this.props.location.search).get('file');
    const nextFile = new URLSearchParams(nextProps.location.search).get('file');
    const sameQueryFile = file === nextFile;

    if (newSharedId === oldSharedId && newLang === oldLang && sameQueryFile) {
      return false;
    }

    return super.urlHasChanged(nextProps) || !sameQueryFile;
  }

  selectTab({ tabView = 'metadata' }) {
    this.context.store.dispatch(actions.set('viewer.sidepanel.tab', tabView));
    this.context.store.dispatch(showTab(tabView === 'metadata' ? 'info' : tabView));
  }

  render() {
    trackPage();
    this.selectTab(this.props.params);
    return (
      <ErrorBoundary error={this.state.loadingError}>
        <ViewerComponent {...this.props} />
      </ErrorBoundary>
    );
  }
}

ViewerRouteComponent.defaultProps = {
  params: {},
};
const ViewerRoute = Object.assign(withRouter(ViewerRouteComponent), {
  requestState: ViewerRouteComponent.requestState,
});

export { ViewerRouteComponent, ViewerRoute };
export default ViewerRoute;
