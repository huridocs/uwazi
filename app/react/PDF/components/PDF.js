import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { SelectionRegion, HandleTextSelection } from '@huridocs/react-text-selection-handler';
import { advancedSort } from 'app/utils/advancedSort';
import { PDFPage } from 'app/PDF';
import { isClient } from '../../utils';
import PDFJS from '../PDFJS';

const cMapUrl = '/legacy_character_maps/';
const cMapPacked = true;

class PDF extends Component {
  static getDerivedStateFromProps(props, state) {
    if (state.filename !== null && state.filename !== props.filename) {
      return { pdf: { numPages: 0 }, filename: props.filename };
    }

    return null;
  }

  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = { pdf: { numPages: 0 }, filename: props.filename };
    this.pagesLoaded = {};
    this.loadDocument(props.file);
    this.currentPage = '1';
    this.pages = {};
    this.pdfReady = false;

    this.pageUnloaded = this.pageUnloaded.bind(this);
    this.pageLoading = this.pageLoading.bind(this);
    this.onPageVisible = this.onPageVisible.bind(this);
    this.onPageHidden = this.onPageHidden.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    if (this.pdfContainer) {
      document.addEventListener('textlayerrendered', e => {
        this.pageLoaded(e.detail.pageNumber);
      });
      document.addEventListener('textlayerrendered', this.props.onPageLoaded, { once: true });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.file !== this.props.file ||
      nextProps.filename !== this.props.filename ||
      nextProps.style !== this.props.style ||
      nextState.pdf !== this.state.pdf
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
      PDFJS.getDocument({
        url: file,
        cMapUrl,
        cMapPacked,
      }).promise.then(pdf => {
        if (this._isMounted) {
          this.setState({ pdf });
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
    return (
      <div
        ref={ref => {
          this.pdfContainer = ref;
        }}
        style={this.props.style}
      >
        <HandleTextSelection
          onSelect={this.props.onTextSelection}
          onDeselect={this.props.onTextDeselection}
        >
          {(() => {
            const pages = [];
            for (let page = 1; page <= this.state.pdf.numPages; page += 1) {
              pages.push(
                <div className="page-wrapper" key={page}>
                  <SelectionRegion regionId={page.toString()}>
                    <PDFPage
                      onUnload={this.pageUnloaded}
                      onLoading={this.pageLoading}
                      onVisible={this.onPageVisible}
                      onHidden={this.onPageHidden}
                      page={page}
                      pdf={this.state.pdf}
                      highlightReference={this.props.highlightReference}
                    />
                  </SelectionRegion>
                </div>
              );
            }
            return pages;
          })()}
        </HandleTextSelection>
      </div>
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
};

export default PDF;
