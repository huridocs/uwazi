import React, { Component } from 'react'
import './scss/alert.scss'

class Alert extends Component {

  constructor(props) {
    super(props);
    this.state = {show: !!this.props.message};
  };

  hide = () => {
    this.setState({show: false});
  };

  show = () => {
    this.setState({show: true});
  };

  render() {
    let cssClass = 'alert alert-' + this.props.type;
    return (
        <div className="alert-wrapper">
        {(() => {
          if(this.state.show){
            return <div className={cssClass}><span>{this.props.message}</span><a onClick={this.hide} className="alert-close"><i className="fa fa-times"></i></a></div>
          }
        })()}
        </div>
    )
  }
}

export default Alert;
