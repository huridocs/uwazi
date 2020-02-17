import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import validate from 'validate.js';
import { Icon } from 'UI';
import { saveConnection, selectRangedTarget } from '../actions/actions';

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
      sourceDocument: { presence: true },
      targetDocument: { presence: true },
      template: { presence: true },
    };

    if (this.props.type === 'basic') {
      delete connection.sourceRange;
    }

    if (this.props.type !== 'basic') {
      validator.sourceRange = { presence: true };
    }

    const connectionValid = !validate(connection, validator);
    const enabled = connectionValid && !this.props.busy;
    const buttonClass =
      this.props.action === 'save' ? 'btn btn-success' : 'edit-metadata btn btn-success';
    let buttonIcon = 'arrow-right';
    if (this.props.busy) {
      buttonIcon = 'spinner';
    }
    if (this.props.action === 'save') {
      buttonIcon = 'save';
    }

    return (
      <button
        className={buttonClass}
        disabled={!enabled}
        onClick={this.onClick.bind(this, enabled, connection)}
      >
        <Icon icon={buttonIcon} spin={!!this.props.busy} />
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
  busy: PropTypes.bool,
};

export function mapStateToProps({ connections }) {
  return {
    type: connections.connection.get('type'),
    connection: connections.connection,
    busy: connections.uiState.get('creating') || connections.uiState.get('connecting'),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ saveConnection, selectRangedTarget }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ActionButton);
