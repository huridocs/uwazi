/** @format */

import { Helmet } from 'react-helmet';
import { browserHistory } from 'react-router';
import { actions as formActions } from 'react-redux-form';
import React from 'react';
import PropTypes from 'prop-types';

import { RequestParams } from 'app/utils/RequestParams';
import { actions } from 'app/BasicReducer';
import { isClient, events } from 'app/utils';
import { toUrlParams } from 'shared/JSONRequest';
import { Component } from 'react';
import Viewer from 'app/Viewer/components/Viewer';
import entitiesAPI from 'app/Entities/EntitiesAPI';
import * as relationships from 'app/Relationships/utils/routeUtils';

import { setReferences } from './actions/referencesActions';
import { scrollToPage, activateReference } from './actions/uiActions';
import { requestViewerState } from './actions/routeActions';

class PDFView extends Component {
  constructor(props, context) {
    super(props, context);
    this.changeBrowserHistoryPage = this.changeBrowserHistoryPage.bind(this);
    this.changePage = this.changePage.bind(this);
    this.onDocumentReady = this.onDocumentReady.bind(this);
  }

  static async requestState(requestParams, globalResources) {
    return requestViewerState(
      requestParams.add({ raw: requestParams.data.raw === 'true' || !isClient }),
      globalResources
    );
  }

  componentWillUnmount() {
    this.emptyState();
  }

  componentWillMount() {
    if (this.props.location.query.searchTerm) {
      this.context.store.dispatch(actions.set('viewer.sidepanel.tab', 'text-search'));
    }
  }

  componentWillReceiveProps(props) {
    const { query = {} } = props.location;
    if (query.page !== this.props.location.query.page && query.raw !== 'true') {
      this.changePage(query.page);
    }
    if (
      (query.page !== this.props.location.query.page ||
        query.raw !== this.props.location.query.raw) &&
      query.raw === 'true'
    ) {
      const { sharedId } = props.params;
      return entitiesAPI
        .getRawPage(new RequestParams({ sharedId, pageNumber: query.page }))
        .then(pageText => {
          this.context.store.dispatch(actions.set('viewer/rawText', pageText));
        });
    }
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
    this.context.store.dispatch(relationships.emptyState());
  }

  changePage(nextPage) {
    if (!this.props.location.query.raw) {
      return scrollToPage(nextPage);
    }

    return this.changeBrowserHistoryPage(nextPage);
  }

  changeBrowserHistoryPage(newPage) {
    const {
      query: { page, ...queryWithoutPage },
    } = this.props.location;
    queryWithoutPage.raw = queryWithoutPage.raw || undefined;
    browserHistory.push(
      `${this.props.location.pathname}${toUrlParams({ ...queryWithoutPage, page: newPage })}`
    );
  }

  onDocumentReady(doc) {
    events.emit('documentLoaded');
    if (this.props.location.query.raw === 'true') {
      return;
    }
    if (this.props.location.query.page) {
      scrollToPage(this.props.location.query.page, 0);
    }
    const { ref } = this.props.location.query;
    if (ref) {
      const reference = doc.get('relationships').find(r => r.get('_id') === ref);
      this.context.store.dispatch(activateReference(reference.toJS(), doc.get('pdfInfo').toJS()));
    }
  }

  render() {
    const { query = {}, pathname } = this.props.location;
    const raw = query.raw === 'true' || !isClient;
    const page = Number(query.page || 1);
    return (
      <React.Fragment>
        <Helmet>{raw && <link rel="canonical" href={`${pathname}?page=${page}`} />}</Helmet>
        <Viewer
          raw={raw}
          searchTerm={query.searchTerm}
          onPageChange={this.changeBrowserHistoryPage}
          onDocumentReady={this.onDocumentReady}
          changePage={this.changePage}
          page={page}
        />
      </React.Fragment>
    );
  }
}

PDFView.contextTypes = {
  store: PropTypes.object,
};

PDFView.defaultProps = {
  params: {},
};

export default PDFView;
