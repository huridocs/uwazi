import React from 'react';
import { actions as formActions } from 'react-redux-form';
import { withRouter } from '#app/componentWrappers.js';
import { RouteHandler } from '#app/App/RouteHandler.js';
import { EntitiesAPI } from '#app/Entities/EntitiesAPI.js';
import { actions } from '#app/BasicReducer/index.js';
import * as relationships from '#app/Relationships/utils/routeUtils.js';
import { showTab } from '#app/Entities/actions/uiActions.js';
import { trackPage } from '#app/App/GoogleAnalytics.js';
import { entityDefaultDocument } from '#shared/entityDefaultDocument.js';
import { ErrorBoundary } from '#V2/Components/ErrorHandling/index.js';
import { PDFViewComponent } from './PDFView.js';
import { Entity } from './EntityView.js';
import { ViewerComponent } from './components/ViewerComponent.js';
import { setReferences } from './actions/referencesActions.js';

class ViewerRouteComponent extends RouteHandler {
  static async requestState(requestParams, globalResources) {
    const { sharedId } = requestParams.data;
    const [entity] = await EntitiesAPI.get(
      requestParams.set({ sharedId, omitRelationships: true })
    );
    const defaultLanguage =
      globalResources.settings?.collection
        ?.get('languages')
        ?.find(l => l.get('default'))
        ?.get('key') || 'en';
    return entityDefaultDocument(entity.documents, entity.language, defaultLanguage)
      ? PDFViewComponent.requestState(requestParams, globalResources)
      : Entity.requestState(requestParams, globalResources);
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.store.dispatch(actions.unset('viewer/doc'));
    this.store.dispatch(actions.unset('viewer/templates'));
    this.store.dispatch(actions.unset('viewer/thesauris'));
    this.store.dispatch(actions.unset('viewer/relationTypes'));
    this.store.dispatch(actions.unset('viewer/rawText'));
    this.store.dispatch(formActions.reset('documentViewer.tocForm'));
    this.store.dispatch(actions.unset('viewer/targetDoc'));
    this.store.dispatch(setReferences([]));
    this.store.dispatch(actions.unset('entityView/entity'));
    this.store.dispatch(relationships.emptyState());
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
    this.store.dispatch(actions.set('viewer.sidepanel.tab', tabView));
    this.store.dispatch(showTab(tabView === 'metadata' ? 'info' : tabView));
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

export { ViewerRouteComponent, ViewerRouteComponent as ViewerRouteView, ViewerRoute };
