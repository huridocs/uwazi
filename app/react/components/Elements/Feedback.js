import React, { Component } from 'react'
import "./scss/feedback.scss";

class Feedback extends Component {

  render() {
    let type = this.props.type || 'info';
      if(type == 'success'){
        return (<span className="feedback feedback-success"><i className="fa fa-check"></i> {this.props.children}</span>)
      }
      if(type == 'error'){
        return (<span className="feedback feedback-error"><i className="fa fa-warning"></i> {this.props.children}</span>)
      }
      if(type == 'info'){
        return (<span className="feedback feedback-info"><i className="fa fa-info"></i> {this.props.children}</span>)
      }
  }
}

export default Feedback;
