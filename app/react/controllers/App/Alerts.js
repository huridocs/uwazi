import React, { Component } from 'react'
import {events} from '../../utils/index'
import Alert from '../../components/Elements/Alert.js'

class Alerts extends Component {

  constructor(props) {
    super(props);
    this.state = {alerts: []};
    this.alertDuration = 2000;

    events.on('alert', (type, message) => {
      this.state.alerts.push({type: type, message: message});
      this.setState({alerts: this.state.alerts});
    })
  };

  render = () => {
    return (
      <div className="alerts">
        {this.state.alerts.map((alert, index) => {
          return <Alert key={index} type={alert.type} message={alert.message} />
        })}
      </div>
    )
  };
}

export default Alerts;
