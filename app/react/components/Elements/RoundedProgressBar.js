import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import Helmet from 'react-helmet'

import './scss/rounded_progress_bar.scss';

class RoundedProgressBar extends Component {

  render() {
    return (
      <div data-percent={this.props.progress} className="rounded-progress-bar">
      </div>
    )
  }
}

export default RoundedProgressBar;
