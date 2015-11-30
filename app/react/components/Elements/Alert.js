import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import Helmet from 'react-helmet'

class Alert extends Component {

  render() {
    let cssClass = 'alert alert-' + this.props.type;
    return (
        <div>
        {(() => {
          if(this.props.message){
            return <p className={cssClass}>{this.props.message}</p>
          }
        })()}
        </div>
    )
  }
}

export default Alert;
