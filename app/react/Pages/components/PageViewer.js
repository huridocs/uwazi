import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Footer from 'app/App/Footer';
import MarkdownViewer from 'app/Markdown';
import MDComponents from 'app/Markdown/components';
import ErrorBoundary from 'app/App/ErrorHandling/ErrorBoundary';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';
import { getRenderError } from 'app/App/ErrorHandling/ErrorUtils';
import Script from './Script';

const { Context } = MDComponents;

class PageViewer extends Component {
  constructor(props) {
    super(props);
    this.state = { customPageError: null };
    this.warningPageError = this.warningPageError.bind(this);
  }

  warningPageError(error) {
    this.setState({ customPageError: error });
  }

  renderErrorWarning() {
    return (
      <div className="alert alert-danger">
        <Icon icon="exclamation-triangle" />
        <Translate>
          There is an unexpected error on this custom page, it may not work properly. Please contact
          an admin for details.
        </Translate>
        <Icon icon="times" onClick={() => this.setState({ customPageError: null })} />
      </div>
    );
  }

  render() {
    const { page, itemLists, datasets, error } = this.props;
    const lists = itemLists.toJS();
    const originalText = page.getIn(['metadata', 'content']) || '';
    const scriptRendered = page.getIn(['scriptRendered']);
    let scriptCode = page.getIn(['metadata', 'script']) || '';
    scriptCode = `var datasets = window.store.getState().page.datasets.toJS();
    ${scriptCode}`;
    const renderError = getRenderError(error instanceof Immutable.Map ? error.toJS() : error);
    return (
      <div className="row">
        {!renderError.name && (
          <>
            <Helmet title={page.get('title') ? page.get('title') : 'Page'} />
            <main className="page-viewer document-viewer">
              <div className="main-wrapper">
                {this.state.customPageError && this.renderErrorWarning()}
                <Context.Provider value={datasets}>
                  <ErrorBoundary>
                    <MarkdownViewer html markdown={originalText} lists={lists} />
                  </ErrorBoundary>
                </Context.Provider>
                <Footer />
              </div>
            </main>
            <Script scriptRendered={scriptRendered} onError={this.warningPageError}>
              {scriptCode}
            </Script>
          </>
        )}
        {renderError.name && (
          <div className="main-wrapper">
            <ErrorFallback error={renderError} />
            <Footer />
          </div>
        )}
      </div>
    );
  }
}

PageViewer.defaultProps = {
  page: Immutable.fromJS({}),
  itemLists: Immutable.fromJS([]),
  datasets: Immutable.fromJS({}),
  error: Immutable.fromJS({}),
};

PageViewer.propTypes = {
  page: PropTypes.instanceOf(Immutable.Map),
  itemLists: PropTypes.instanceOf(Immutable.List),
  datasets: PropTypes.instanceOf(Immutable.Map),
  error: PropTypes.instanceOf(Immutable.Map),
};

const mapStateToProps = ({ page }) => ({
  page: page.pageView,
  datasets: page.datasets,
  itemLists: page.itemLists,
  error: page.error,
});

const container = connect(mapStateToProps)(PageViewer);

export { container as PageViewer };
