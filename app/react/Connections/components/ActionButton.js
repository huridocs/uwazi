import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Map } from 'immutable';
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

  renderIcon() {
    let buttonIcon = 'arrow-right';
    if (this.props.busy) {
      buttonIcon = 'spinner';
    }
    if (this.props.action === 'save') {
      buttonIcon = 'save';
    }
    return <Icon icon={buttonIcon} spin={!!this.props.busy} />;
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

    return (
      <button
        className={buttonClass}
        disabled={!enabled}
        type="button"
        onClick={this.onClick.bind(this, enabled, connection)}
      >
        {this.renderIcon()}
      </button>
    );
  }
}

ActionButton.defaultProps = {
  onCreate: () => {},
  onRangedConnect: () => {},
  type: '',
  busy: false,
};

ActionButton.propTypes = {
  type: PropTypes.string,
  connection: PropTypes.instanceOf(Map).isRequired,
  saveConnection: PropTypes.func.isRequired,
  selectRangedTarget: PropTypes.func.isRequired,
  onCreate: PropTypes.func,
  onRangedConnect: PropTypes.func,
  action: PropTypes.string.isRequired,
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
