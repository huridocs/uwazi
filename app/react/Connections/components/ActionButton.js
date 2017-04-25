import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveConnection, selectRangedTarget} from '../actions/actions';
import validate from 'validate.js';

export class ActionButton extends Component {

  onClick(enabled, connection) {
    if (enabled) {
      if (this.props.action === 'save') {
        this.props.saveConnection(connection, this.props.onCreate);
      }
      if (this.props.action === 'connect') {
        this.props.selectRangedTarget(connection, this.props.onRangedConnect);
      }
    }
  }

  render() {
    const connection = this.props.connection.toJS();

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

    const connectionValid = !validate(connection, validator);
    const enabled = connectionValid && !this.props.busy;
    const buttonClass = this.props.action === 'save' ? 'btn btn-success' : 'edit-metadata btn btn-success';
    const iClass = this.props.action === 'save' ? 'fa fa-save' : 'fa fa-arrow-right';

    return (
      <button className={buttonClass}
              disabled={!enabled}
              onClick={this.onClick.bind(this, enabled, connection)}>
        <i className={this.props.busy ? 'fa fa-spinner fa-spin' : iClass}></i>
      </button>
    );
  }
}

ActionButton.propTypes = {
  type: PropTypes.string,
  connection: PropTypes.object,
  saveConnection: PropTypes.func,
  selectRangedTarget: PropTypes.func,
  onCreate: PropTypes.func,
  onRangedConnect: PropTypes.func,
  action: PropTypes.string,
  busy: PropTypes.bool
};

export function mapStateToProps({connections}) {
  return {
    type: connections.connection.get('type'),
    connection: connections.connection,
    busy: connections.uiState.get('creating') || connections.uiState.get('connecting')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveConnection, selectRangedTarget}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ActionButton);
