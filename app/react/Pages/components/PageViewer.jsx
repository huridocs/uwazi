import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component, Suspense } from 'react';

import { Footer } from '#app/App/Footer.js';
import { MarkdownViewer } from '#app/Markdown/index.js';
import { Context } from '#app/Markdown/components/index.js';
import { Icon } from '#UI/Icon/Icon.js';
import { Translate } from '#app/I18N/index.js';
import { NeedAuthorization } from '#app/Auth/index.js';
import { ErrorBoundary, ErrorFallback } from '#V2/Components/ErrorHandling/index.js';
import { PageStyleConnected } from './PageStyle.js';
import { ScriptConnected } from './Script.js';

class PageViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.warningPageError = this.warningPageError.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.page.get('title') !== this.props.page.get('title')) {
      this.removeCustomPageError();
    }
  }

  componentWillUnmount() {
    if (this.state.customPageError) {
      this.removeCustomPageError();
    }
  }

  warningPageError(error) {
    this.setState({ customPageError: error });
  }

  removeCustomPageError() {
    this.setState({ customPageError: null });
  }

  renderErrorWarning() {
    return (
      <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
        <div className="alert alert-danger">
          <Icon icon="exclamation-triangle" />
          <Translate translationKey="custom page error warning">
            There is an unexpected error on this custom page, it may not work properly. Please
            contact an admin for details.
          </Translate>
          <Icon icon="times" onClick={() => this.removeCustomPageError()} />
        </div>
      </NeedAuthorization>
    );
  }

  // eslint-disable-next-line max-statements
  render() {
    const { page, itemLists, datasets, error: _error, setBrowserTitle } = this.props;
    const errorDetails = _error.toJS?.();

    let rawError = null;
    if (errorDetails) {
      if (errorDetails.json) {
        rawError = errorDetails.json;
      } else if (errorDetails.error || errorDetails.status || errorDetails.message) {
        rawError = errorDetails;
      }
    } else {
      rawError = _error;
    }

    let processedError = null;
    if (rawError && (rawError.error || rawError.message || rawError.status || rawError.code)) {
      const notFoundStatus = rawError.error === 'Page not found';
      processedError = {
        ...rawError,
        status:
          rawError.status || rawError.code || errorDetails?.status || (notFoundStatus ? 404 : 500),
        name: rawError.error || rawError.name,
        message: !notFoundStatus ? rawError.prettyMessage : '',
      };
    }
    const lists = itemLists.toJS();
    const parseMarkdown = page.get('markdownSupport') === true;
    const originalText = page.getIn(['metadata', 'content']) || '';
    const scriptRendered = page.getIn(['scriptRendered']);
    const pageCss = page.getIn(['metadata', 'css']) || '';
    let scriptCode = page.getIn(['metadata', 'script']) || '';
    scriptCode = `var datasets = window.store.getState().page.datasets.toJS();
    ${scriptCode}`;

    return (
      <Suspense
        fallback={
          <div>
            <Translate>Loading</Translate>...
          </div>
        }
      >
        <div className="row">
          {!processedError && (
            <>
              {setBrowserTitle && (
                <Helmet>
                  <title>{page.get('title') ? page.get('title') : 'Page'}</title>
                </Helmet>
              )}
              <main className="page-viewer document-viewer">
                <div className="main-wrapper">
                  <PageStyleConnected>{pageCss}</PageStyleConnected>
                  {this.state.customPageError && this.renderErrorWarning()}
                  <Context.Provider value={datasets}>
                    <ErrorBoundary>
                      <MarkdownViewer
                        html
                        markdown={originalText}
                        lists={lists}
                        sanitized={false}
                        parseMarkdown={parseMarkdown}
                      />
                    </ErrorBoundary>
                  </Context.Provider>
                  <Footer />
                </div>
              </main>
              <ScriptConnected
                scriptRendered={scriptRendered}
                onError={e => this.warningPageError(e)}
              >
                {scriptCode}
              </ScriptConnected>
            </>
          )}
          {processedError && (
            <div className="main-wrapper">
              <ErrorFallback error={processedError} />
              <Footer />
            </div>
          )}
        </div>
      </Suspense>
    );
  }
}

PageViewer.defaultProps = {
  page: Immutable.fromJS({}),
  itemLists: Immutable.fromJS([]),
  datasets: Immutable.fromJS({}),
  error: Immutable.fromJS({}),
  setBrowserTitle: true,
};

PageViewer.propTypes = {
  page: PropTypes.instanceOf(Immutable.Map),
  itemLists: PropTypes.instanceOf(Immutable.List),
  datasets: PropTypes.instanceOf(Immutable.Map),
  error: PropTypes.oneOfType([PropTypes.instanceOf(Immutable.Map), PropTypes.object]),
  setBrowserTitle: PropTypes.bool,
};

const mapStateToProps = ({ page }) => ({
  page: page.pageView,
  datasets: page.datasets,
  itemLists: page.itemLists,
  error: page.error,
});

const container = connect(mapStateToProps)(PageViewer);

export { container as PageViewer };
