import { actions } from 'app/BasicReducer';

import { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class Script extends Component {
  constructor(props) {
    super(props);

    this.scriptElement = null;
  }

  componentDidMount() {
    this.appendScript();
    window.onerror = this.props.onError;
  }

  componentDidUpdate(prevProps) {
    const { children } = this.props;
    if (children !== prevProps.children) {
      this.removeScript();
      this.appendScript();
    } else if (this.scriptElement === null) {
      this.appendScript();
    }
  }

  componentWillUnmount() {
    this.removeScript();
  }

  appendScript() {
    const { children, scriptRendered } = this.props;
    if (children && scriptRendered === false) {
      const s = document.createElement('script');
      s.src = `data:text/javascript,(function(){${encodeURIComponent(`\n\n${children}\n\n`)}})()`;
      document.body.appendChild(s);
      this.scriptElement = s;
      this.props.dispatch(actions.setIn('page/pageView', 'scriptRendered', true));
    }
  }

  removeScript() {
    if (this.scriptElement) {
      this.scriptElement.remove();
      this.scriptElement = null;
    }
  }

  render() {
    return null;
  }
}

Script.defaultProps = {
  children: '',
  scriptRendered: null,
};

Script.propTypes = {
  children: PropTypes.string,
  scriptRendered: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

const container = connect()(Script);

export default container;
