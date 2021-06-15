import { actions } from 'app/BasicReducer';

import { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class Script extends Component {
  constructor(props) {
    super(props);

    this.state = {
      scriptElement: null,
    };
  }

  componentDidMount() {
    this.appendScript();
  }

  componentDidUpdate(prevProps) {
    const { children } = this.props;
    if (children !== prevProps.children) {
      this.removeScript();
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
      this.setState({ scriptElement: s });
      this.props.dispatch(actions.setIn('page/pageView', 'scriptRendered', true));
    }
  }

  removeScript() {
    if (this.state.scriptElement) {
      this.state.scriptElement.remove();
      this.setState({ scriptElement: null });
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
};

const container = connect()(Script);

export default container;
