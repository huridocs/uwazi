import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveConnection, selectRangedTarget} from '../actions/actions';
import validate from 'validate.js';

export class SaveButton extends Component {

  onClick(enabled, connection) {
    if (enabled) {
      switch (this.props.action) {
      case 'save':
        this.props.saveConnection(connection, this.props.onCreate);
        break;
      case 'connect':
        this.props.selectRangedTarget(connection, this.props.onRangedConnect);
        break;
      default:
        break;
      }
    }
  }

  render() {
    let connection = this.props.connection.toJS();

    const validator = {
      sourceDocument: {presence: true},
      targetDocument: {presence: true},
      relationType: {presence: true}
    };

    if (this.props.type === 'basic') {
      delete connection.sourceRange;
    }

    if (this.props.type !== 'basic') {
      validator.sourceRange = {presence: true};
    }

    let connectionReady = !validate(connection, validator);
    let disabled = !connectionReady || this.props.busy;
    // console.log('En button POST:', connection);

    switch (this.props.action) {
    case 'save':
      return <button className="btn btn-success"
                     disabled={disabled}
                     onClick={this.onClick.bind(this, !disabled, connection)}>
               <i className={this.props.busy ? 'fa fa-spinner fa-spin' : 'fa fa-save'}></i>
             </button>;
    case 'connect':
      return <button className="edit-metadata btn btn-success"
                     disabled={!connectionReady}
                     onClick={this.onClick.bind(this, !disabled, connection)}>
               <i className={this.props.busy ? 'fa fa-spinner fa-spin' : 'fa fa-arrow-right'}></i>
             </button>;
    default:
      return;
    }
  }
}

SaveButton.propTypes = {
  saveConnection: PropTypes.func,
  selectRangedTarget: PropTypes.func,
  onCreate: PropTypes.func,
  onRangedConnect: PropTypes.func,
  action: PropTypes.string,
  type: PropTypes.string,
  connection: PropTypes.object,
  busy: PropTypes.bool
};

function mapStateToProps({connections}) {
  return {
    type: connections.connection.get('type'),
    connection: connections.connection,
    busy: connections.uiState.get('creating') || connections.uiState.get('connecting')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveConnection, selectRangedTarget}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SaveButton);
