import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { withRouter } from 'app/componentWrappers';
import { RequestParams } from 'app/utils/RequestParams';
import { actions } from 'app/BasicReducer';
import { isClient, events } from 'app/utils';
import { toUrlParams } from 'shared/JSONRequest';
import { ConnectedViewer as Viewer } from 'app/Viewer/components/Viewer';
import entitiesAPI from 'app/Entities/EntitiesAPI';
import { leaveEditMode } from 'app/Viewer/actions/documentActions';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { scrollToPage, activateReference } from './actions/uiActions';
import { requestViewerState } from './actions/routeActions';

const defaultDoc = entity => (entity.get('defaultDoc') ? entity.get('defaultDoc').toJS() : {});

class PDFViewComponent extends Component {
  static async requestState(requestParams, globalResources) {
    return requestViewerState(
      requestParams.add({ raw: requestParams.data.raw === 'true' || !isClient }),
      globalResources
    );
  }

  constructor(props, context) {
    super(props, context);
    this.changeBrowserHistoryPage = this.changeBrowserHistoryPage.bind(this);
    this.changePage = this.changePage.bind(this);
    this.onDocumentReady = this.onDocumentReady.bind(this);
  }

  componentDidMount() {
    const query = searchParamsFromSearchParams(this.props.searchParams);
    if (query.searchTerm) {
      this.context.store.dispatch(actions.set('viewer.sidepanel.tab', 'text-search'));
    }
  }

  componentWillReceiveProps(props) {
    const currentQuery = searchParamsFromSearchParams(this.props.searchParams);
    const query = searchParamsFromSearchParams(props.searchParams);

    if (query.page !== currentQuery.page && query.raw !== 'true') {
      this.changePage(query.page);
    }
    if (
      (query.page !== currentQuery.page || query.raw !== currentQuery.raw) &&
      query.raw === 'true'
    ) {
      entitiesAPI
        .getRawPage(new RequestParams({ _id: defaultDoc(props.entity)._id, page: query.page }))
        .then(pageText => {
          this.context.store.dispatch(actions.set('viewer/rawText', pageText));
        });
    }
  }

  componentWillUnmount() {
    this.props.leaveEditMode();
  }

  onDocumentReady(doc) {
    events.emit('documentLoaded');
    const query = searchParamsFromSearchParams(this.props.searchParams);

    if (query.raw === 'true') {
      return;
    }
    if (query.page) {
      scrollToPage(query.page, 0);
    }
    const { ref } = query;
    if (ref) {
      const reference = doc.get('relations').find(r => r.get('_id') === ref);
      this.context.store.dispatch(activateReference(reference.toJS()));
    }
  }

  changePage(nextPage) {
    const { raw = 'false' } = searchParamsFromSearchParams(this.props.searchParams);

    const notRaw = String(raw).toLowerCase() === 'false';
    if (notRaw) {
      return scrollToPage(nextPage);
    }

    return this.changeBrowserHistoryPage(nextPage, notRaw);
  }

  changeBrowserHistoryPage(newPage, replace = true) {
    const { page, ...queryWithoutPage } = searchParamsFromSearchParams(this.props.searchParams);

    this.props.navigate(
      `${this.props.location.pathname}${toUrlParams({ ...queryWithoutPage, page: newPage })}`,
      { replace }
    );
  }

  render() {
    const query = searchParamsFromSearchParams(this.props.searchParams);
    const page = Number(query.page || 1);
    const { pathname } = this.props.location;
    const raw = query.raw === 'true' || !isClient;

    return (
      <>
        <Helmet>{raw && <link rel="canonical" href={`${pathname}?page=${page}`} />}</Helmet>
        <Viewer
          raw={raw}
          searchTerm={query.searchTerm}
          onPageChange={this.changeBrowserHistoryPage}
          onDocumentReady={this.onDocumentReady}
          changePage={this.changePage}
          page={page}
          file={defaultDoc(this.props.entity)}
        />
      </>
    );
  }
}

PDFViewComponent.contextTypes = {
  store: PropTypes.instanceOf(Object),
};

PDFViewComponent.propTypes = {
  entity: PropTypes.instanceOf(Object).isRequired,
  leaveEditMode: PropTypes.func,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
  navigate: PropTypes.func.isRequired,
  searchParams: PropTypes.instanceOf(Object).isRequired,
};

PDFViewComponent.defaultProps = {
  leaveEditMode: () => {},
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ leaveEditMode }, dispatch);
}

const SSRPDFView = connect(null, mapDispatchToProps)(withRouter(PDFViewComponent));
const PDFView = Object.assign(SSRPDFView, { requestState: PDFViewComponent.requestState });
export { PDFView, PDFViewComponent };
