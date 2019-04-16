import { Component } from 'react';
import PropTypes from 'prop-types';

class Script extends Component {
  componentDidMount() {
    this.appendScript();
  }

  componentDidUpdate(prevProps) {
    const { children } = this.props;
    if (children !== prevProps.children) {
      this.appendScript();
    }
  }

  appendScript() {
    const { children } = this.props;
    if (children) {
      const s = document.createElement('script');
      s.src = `data:text/javascript,(function(){${encodeURIComponent(`\n\n${children}\n\n`)}})()`;
      document.body.appendChild(s);
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
