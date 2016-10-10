import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveConnection} from '../actions/actions';
import validate from 'validate.js';

export class SaveButton extends Component {

  onClick(enabled, connection) {
    if (enabled) {
      this.props.saveConnection(connection, 'connections');
    }
  }

  render() {
    let connection = this.props.connection.toJS();
    delete connection.type;

    // let tab = 'connections';

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
      // tab = 'references';
    }

    let connectionReady = !validate(connection, validator);

    return (
      <button className="btn btn-success"
              disabled={!connectionReady || this.props.saving}
              onClick={this.onClick.bind(this, connectionReady && !this.props.saving, connection)}>
        <i className={this.props.saving ? 'fa fa-spinner fa-spin' : 'fa fa-save'}></i>
      </button>
    );
  }
}

SaveButton.propTypes = {
  saveConnection: PropTypes.func,
  type: PropTypes.string,
  connection: PropTypes.object,
  saving: PropTypes.bool
};

function mapStateToProps({connections}) {
  return {
    type: connections.connection.get('type'),
    connection: connections.connection,
    saving: connections.uiState.get('creating')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveConnection}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SaveButton);
