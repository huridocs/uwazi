import { Component } from 'react';
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
    const { children } = this.props;
    if (children) {
      const s = document.createElement('script');
      s.src = `data:text/javascript,(function(){${encodeURIComponent(`\n\n${children}\n\n`)}})()`;
      document.body.appendChild(s);
      this.setState({ scriptElement: s });
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
};

Script.propTypes = {
  children: PropTypes.string,
};

export default Script;
