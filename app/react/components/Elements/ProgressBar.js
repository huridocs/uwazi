import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import Helmet from 'react-helmet'

import './scss/progress_bar.scss';

class ProgressBar extends Component {

  render() {

    let progressWidth = {
      width: this.props.progress+'%'
    };

    let show = {};
    if(this.props.progress > 0){
      show = {
        display: 'inherit'
      }
    }

    return (
      <div className="upload-bar" style={show}>
        <div className="upload-bar-progress" style={progressWidth}></div>
      </div>
    )
  }
}

export default ProgressBar;
