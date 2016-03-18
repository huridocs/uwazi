import React, {Component, PropTypes} from 'react';

import './scss/rounded_progress_bar.scss';

class RoundedProgressBar extends Component {

  render() {
    if (this.props.progress > 0) {
      return <div data-percent={this.props.progress} className="rounded-progress-bar" />;
    }

    return <i className="fa fa-check"></i>;
  }

}

RoundedProgressBar.propTypes = {
  progress: PropTypes.number
};

export default RoundedProgressBar;
