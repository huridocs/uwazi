import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import Helmet from 'react-helmet'

import './scss/rounded_progress_bar.scss';

class RoundedProgressBar extends Component {

  render() {
    if(this.props.progress > 0){
      return (
        <div data-percent={this.props.progress} className="rounded-progress-bar">
        </div>
      )
    }else {
      return (<i className="fa fa-check"></i>);
    }
  }
}

export default RoundedProgressBar;
