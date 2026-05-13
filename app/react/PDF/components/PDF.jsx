import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { SelectionRegion, HandleTextSelection } from '@huridocs/react-text-selection-handler';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { advancedSort } from '#app/utils/advancedSort.js';
import { Translate } from '#app/I18N/index.js';
import { PDFPage } from '#app/PDF/index.js';
import { BlankState } from '#app/V2/Components/UI/index.js';
import { selectionHandlers } from '#V2/Components/PDFViewer/index.js';
import { PDFJS, CMAP_URL } from '#V2/Components/PDFViewer/pdfjs.js';
import { isClient } from '../../utils/index.js';
import 'pdfjs-dist/web/pdf_viewer.css';
import { reportErrorToSentry } from '#app/V2/shared/errorUtils.js';

const cMapPacked = true;

class PDF extends Component {
  static getDerivedStateFromProps(props, state) {
    if (state.filename !== null && state.filename !== props.filename) {
      return { pdf: { numPages: 0 }, filename: props.filename };
    }

    return null;
  }

  // eslint-disable-next-line max-statements
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = { pdf: { numPages: 0 }, filename: props.filename, scale: 1, error: null };
    this.pagesLoaded = {};
    this.loadDocument(props.file);
    this.currentPage = '1';
    this.pages = {};
    this.pdfReady = false;

    this.pageUnloaded = this.pageUnloaded.bind(this);
    this.pageLoading = this.pageLoading.bind(this);
    this.onPageVisible = this.onPageVisible.bind(this);
    this.onPageHidden = this.onPageHidden.bind(this);
    this.handleScaleChange = this.handleScaleChange.bind(this);
    this.containerWidth = 0;
  }

  componentDidMount() {
    this._isMounted = true;
    if (this.pdfContainer) {
      document.addEventListener('textlayerrendered', e => {
        this.pageLoaded(e.detail.pageNumber);
      });
      document.addEventListener('textlayerrendered', this.props.onPageLoaded, { once: true });
    }

    this.containerWidth = this.props.parentRef.current?.clientWidth;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.file !== this.props.file ||
      nextProps.filename !== this.props.filename ||
      nextProps.style !== this.props.style ||
      nextState.pdf !== this.state.pdf ||
      nextState.scale !== this.state.scale ||
      nextState.error !== this.state.error
    );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.filename !== null && this.props.filename !== prevProps.filename) {
      this.pagesLoaded = {};
      this.loadDocument(prevProps.file);
    }

    if (this.state.pdf.numPages && !this.pdfReady) {
      this.pdfReady = true;
      this.props.onPDFReady();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  handleScaleChange(scale) {
    this.setState({ scale });
  }

  onPageVisible(page, visibility) {
    this.pages[page] = visibility;

    const pageWithMostVisibility = Object.keys(this.pages).reduce((memo, key) => {
      if (!this.pages[key - 1] || this.pages[key] > this.pages[key - 1]) {
        return key;
      }
      return memo;
    }, 1);

    if (this.currentPage !== pageWithMostVisibility) {
      this.currentPage = pageWithMostVisibility;
      this.props.onPageChange(Number(pageWithMostVisibility));
    }
  }

  onPageHidden(page) {
    delete this.pages[page];
  }

  loadDocument(file) {
    if (isClient) {
      if (this._isMounted) {
        this.setState({ error: null });
      }
      PDFJS.getDocument({
        url: file,
        cMapUrl: CMAP_URL,
        cMapPacked,
        isEvalSupported: false,
      })
        .promise.then(pdf => {
          if (this._isMounted) {
            this.setState({ pdf });
          }
        })
        .catch(e => {
          if (!this._isMounted) {
            return;
          }

          if (e.status === 404) {
            this.setState({
              error: (
                <Translate>
                  This file is currently unavailable. Please contact your administrator if the issue
                  persists.
                </Translate>
              ),
            });
          } else if (e.name === 'InvalidPDFException') {
            this.setState({
              error: (
                <Translate>
                  This file could not be opened. It may be corrupted or not a valid PDF.
                </Translate>
              ),
            });
          } else {
            this.setState({
              error: (
                <Translate>This file could not be displayed. Try refreshing the page.</Translate>
              ),
            });
            reportErrorToSentry(e, 'pdf-error');
          }
        });
    }
  }

  pageUnloaded(numPage) {
    delete this.pagesLoaded[numPage];
    this.loaded();
  }

  pageLoading(numPage) {
    this.pagesLoaded[numPage] = false;
  }

  pageLoaded(numPage) {
    this.pagesLoaded[numPage] = true;
    const allPagesLoaded =
      Object.keys(this.pagesLoaded)
        .map(p => this.pagesLoaded[p])
        .filter(p => !p).length === 0;
    if (allPagesLoaded) {
      this.loaded();
    }
  }

  loaded() {
    const pages = Object.keys(this.pagesLoaded).map(n => parseInt(n, 10));

    const allConsecutives = advancedSort(pages, { treatAs: 'number' }).reduce((memo, number) => {
      if (memo === false) {
        return memo;
      }

      if (memo === null) {
        return number;
      }

      return number - memo > 1 ? false : number;
    }, null);

    if (allConsecutives) {
      this.props.onLoad({
        pages,
      });
    }
  }

  render() {
    const { scale, error } = this.state;
    const handleSelect = selection => {
      const normalized = selectionHandlers.adjustSelectionsToScale(selection, scale, true);
      this.props.onTextSelection(normalized);
    };
    const viewerStyle = {
      ...this.props.style,
      '--page-border': 'none',
      '--page-margin': '0',
    };
    if (error) {
      return (
        <div className="tw-content" data-testid="errorInfo">
          <BlankState
            icon={
              <ExclamationTriangleIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />
            }
            title={error}
            description=""
          />
        </div>
      );
    }
    return (
      <HandleTextSelection onSelect={handleSelect} onDeselect={this.props.onTextDeselection}>
        <div
          ref={ref => {
            this.pdfContainer = ref;
          }}
          style={viewerStyle}
          id="pdf-container"
          className="pdfViewer"
        >
          {(() => {
            const pages = [];
            for (let page = 1; page <= this.state.pdf.numPages; page += 1) {
              pages.push(
                <div key={page}>
                  <SelectionRegion regionId={page.toString()}>
                    <PDFPage
                      onUnload={this.pageUnloaded}
                      onLoading={this.pageLoading}
                      onVisible={this.onPageVisible}
                      onHidden={this.onPageHidden}
                      page={page}
                      pdf={this.state.pdf}
                      highlightReference={this.props.highlightReference}
                      containerWidth={this.containerWidth}
                      onScaleChange={this.handleScaleChange}
                    />
                  </SelectionRegion>
                </div>
              );
            }
            return pages;
          })()}
        </div>
      </HandleTextSelection>
    );
  }
}

PDF.defaultProps = {
  onPageLoaded: () => {},
  filename: null,
  onPageChange: () => {},
  onPDFReady: () => {},
  style: {},
  onTextSelection: () => {},
  onTextDeselection: () => {},
  highlightReference: () => {},
};

PDF.propTypes = {
  onPageChange: PropTypes.func,
  onTextSelection: PropTypes.func,
  onTextDeselection: PropTypes.func,
  onPageLoaded: PropTypes.func,
  onPDFReady: PropTypes.func,
  file: PropTypes.string.isRequired,
  filename: PropTypes.string,
  onLoad: PropTypes.func.isRequired,
  style: PropTypes.object,
  highlightReference: PropTypes.func,
  parentRef: PropTypes.object.isRequired,
};

export { PDF };
