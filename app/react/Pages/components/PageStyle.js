import { actions } from '#app/BasicReducer/index.js';

import { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const STYLE_ATTR = 'data-uwazi-page-style';

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
  }

  appendStyle() {
    const { children, cssRendered } = this.props;
    if (children && cssRendered === false) {
      const el = document.createElement('style');
      el.type = 'text/css';
      el.setAttribute(STYLE_ATTR, 'true');
      el.textContent = children;
      document.head.appendChild(el);
      this.styleElement = el;
      this.props.dispatch(actions.setIn('page/pageView', 'cssRendered', true));
    }
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
  cssRendered: null,
};

PageStyle.propTypes = {
  children: PropTypes.string,
  cssRendered: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
};

const PageStyleConnected = connect()(PageStyle);
export { PageStyle, PageStyleConnected };
