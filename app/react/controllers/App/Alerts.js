import React, {Component} from 'react';
import {events} from '../../utils/index';
import Alert from '../../components/Elements/Alert.js';
//import './scss/alerts.scss';

class Alerts extends Component {

  constructor(props) {
    super(props);
    this.state = {alerts: []};
    this.alertDuration = 3000;

    events.on('alert', (type, message) => {
      let alert = {type: type, message: message};
      this.addAlert(alert);
      setTimeout(() => {
        this.removeAlert(alert);
      }, this.alertDuration);
    });
  }

  addAlert(alert) {
    this.state.alerts.push(alert);
    this.setState({alerts: this.state.alerts});
  }

  removeAlert(alert) {
    let index = this.state.alerts.indexOf(alert);
    this.state.alerts.splice(index, 1);
    this.setState({alerts: this.state.alerts});
  }

  render() {
    return (
      <div className="alerts">
        {this.state.alerts.map((alert, index) => {
          return <Alert key={index} type={alert.type} message={alert.message} />;
        })}
      </div>
    );
  }
}

export default Alerts;
