import { Component } from 'react';
import PropTypes from 'prop-types';

const STYLE_ATTR = 'data-uwazi-page-style';
/** Same id as SSR inline page style in Root — replaced on client when CSS updates. */
const PAGE_STYLE_ELEMENT_ID = 'uwazi-page-style-inline';

class PageStyle extends Component {
  constructor(props) {
    super(props);
    this.styleElement = null;
  }

  componentDidMount() {
    this.appendStyle();
  }

  componentDidUpdate(prevProps) {
    const { children } = this.props;
    if (children !== prevProps.children) {
      this.removeStyle();
      this.appendStyle();
    } else if (this.styleElement === null) {
      this.appendStyle();
    }
  }

  componentWillUnmount() {
    this.removeStyle();
    document.getElementById(PAGE_STYLE_ELEMENT_ID)?.remove();
  }

  appendStyle() {
    const { children } = this.props;
    if (!children) {
      return;
    }

    const existingById = document.getElementById(PAGE_STYLE_ELEMENT_ID);
    if (existingById && existingById.textContent === children) {
      this.styleElement = existingById;
      return;
    }

    document.getElementById(PAGE_STYLE_ELEMENT_ID)?.remove();

    const el = document.createElement('style');
    el.id = PAGE_STYLE_ELEMENT_ID;
    el.type = 'text/css';
    el.setAttribute(STYLE_ATTR, 'true');
    el.textContent = children;
    document.head.appendChild(el);
    this.styleElement = el;
  }

  removeStyle() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }

  render() {
    return null;
  }
}

PageStyle.defaultProps = {
  children: '',
};

PageStyle.propTypes = {
  children: PropTypes.string,
};

/** @deprecated Use `PageStyle`; kept for a single import site in PageViewer. */
const PageStyleConnected = PageStyle;

export { PageStyle, PageStyleConnected, PAGE_STYLE_ELEMENT_ID };
