import React, { Component } from 'react'

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
